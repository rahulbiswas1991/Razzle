import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useDropzone } from "react-dropzone";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { UploadCloud, X, ArrowLeft, ArrowRight, Bolt, Clock, Target, Lock, Globe, Rocket } from "lucide-react";
import { createRaffle } from "../services/raffleService";
import { fetchUserProfile } from "../store/user/thunks";

const CreateRaffleForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user.user);
  const userLoading = useSelector(state => state.user.loading);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    spots_count: 10,
    ends_enabled: false,
    is_private: false,
    raffle_image: null,
  draw_days: "10",
  // auto_delete_days removed, always use 30 in API
    type: "open", // 'open' or 'fixed'
  });

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [bookendError, setBookendError] = useState("");
  const [apiErrors, setApiErrors] = useState({});
  const [creditError, setCreditError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userCredits, setUserCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const handleLaunch = async () => {
    // Validate step 2 before showing modal
    if (!validateStep2()) {
      return;
    }

    setLoadingCredits(true);
    try {
      // Fetch user profile to get current credits
      const userProfile = await dispatch(fetchUserProfile()).unwrap();
      const credits = userProfile?.user?.credits_balance || 0;
      setUserCredits(credits);
      
      // Automatically create draft raffle first
      await handleCreateRaffle(true);
      
      // Then set up modal state based on credits
      if (credits < formData.spots_count) {
        setCreditError({
          message: 'Insufficient credits to launch this razzle.',
          balance: credits,
          requiredBalance: formData.spots_count,
        });
        setShowModal(true);
      } else {
        setCreditError(null);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch user credits or create draft:', error);
      setApiErrors({ general: 'Failed to process request. Please try again.' });
    } finally {
      setLoadingCredits(false);
    }
  };

  // Handle creating raffle (either launch or draft)
  const handleCreateRaffle = async (forceDraft = false) => {
    try {
      setIsSubmitting(true);
      setApiErrors({});
      setCreditError(null);
      setSuccessMessage(null);

      // Convert image to Base64 if it exists
      let imageBase64 = formData.raffle_image;
      if (formData.raffle_image && formData.raffle_image instanceof File) {
        imageBase64 = await convertFileToBase64(formData.raffle_image);
      }

      // Format data for API
      const days = Number(formData.draw_days);
      let drawDate = null;
      if (!isNaN(days) && days >= 5) {
        drawDate = new Date();
        drawDate.setDate(drawDate.getDate() + days);
      }
      const apiData = {
        title: formData.title,
        description: formData.description,
        scope: formData.is_private ? "private" : "public",
        spots_count: formData.spots_count,
        ends_enabled: formData.ends_enabled,
        auto_delete_days: "30",
        starts_at: drawDate ? drawDate.toISOString() : null,
        type: formData.type,
        raffle_image: imageBase64,
        force_draft: forceDraft
      };

      const response = await createRaffle(apiData);
      console.log(
        response
      );
      
      setSuccessMessage({
        message: response.message || "Razzle created successfully!",
        razzleId: response.raffle?.slug,
      });

      setShowModal(false);

    } catch (error) {
      if (error instanceof Error) {
        let errorData;
        try {
          errorData = JSON.parse(error.message);
        } catch (e) {
          // Not JSON, treat as string
          setApiErrors({ general: error.message || "An unexpected error occurred" });
          return;
        }
        // Handle credit error specifically
        if (typeof errorData.errors?.balance === "number") {
          setCreditError({
            message: errorData.message,
            balance: errorData.errors.balance,
            requiredBalance: errorData.errors.required_balance,
          });
        } else {
          // Handle validation errors
          setApiErrors(errorData.errors || {});
        }
      } else {
        setApiErrors({ general: "An unexpected error occurred" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set default start date to current date + 5 days
  useEffect(() => {
    const fiveDaysLater = new Date();
    fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
    setFormData((prev) => ({
      ...prev,
      starts_at: fiveDaysLater,
    }));
  }, []);

  // Dropzone for image upload
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setErrors((prev) => ({
          ...prev,
          raffle_image: "File size must be less than 5MB",
        }));
        return;
      }

      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          raffle_image: "Only image files are allowed",
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        raffle_image: file,
      }));

      const reader = new FileReader();
      reader.onload = (e) => {
        if (
          typeof e.target.result === "string" &&
          e.target.result.startsWith("data:image")
        ) {
          setPreview(e.target.result);
        } else {
          setPreview(null);
        }
      };
      reader.readAsDataURL(file);

      setErrors((prev) => ({
        ...prev,
        raffle_image: "",
      }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: false,
  });

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      raffle_image: null,
    }));
    setPreview(null);
  };

  // Convert File to Base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Form validation for step 1
  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.raffle_image) {
      newErrors.raffle_image = "Razzle image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form validation for step 2
  const validateStep2 = () => {
    const newErrors = {};

    if (formData.spots_count < 10) {
      newErrors.spots_count = "Minimum 10 spots required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    // Bookend bonus validation: if type is open, ends_enabled cannot be true
    if (field === "type" && value === "open" && formData.ends_enabled) {
      setBookendError("Bookend Bonus cannot be enabled for Open Razzle typeee.");
    } else if (field === "type" && value === "fixed") {
      setBookendError("");
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Handle form submission (only for navigation between steps)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep === 1) {
      handleNextStep();
      return;
    }

    // For step 2, don't submit - the preview button will handle the modal
    return;
  };

  return (
    <div className="w-full h-full bg-white shadow-lg shadow-gray-500/50 rounded-sm overflow-hidden">
      {/* Header Section */}
      <div className="bg-blue-600 to-purple-600 px-4 py-4 text-white">
        <h1 className="text-2xl font-bold mb-2">Create Your Razzle</h1>
        <p className="text-blue-100">
          Set up your razzle in just a few simple steps
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-center max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                currentStep >= 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              1
            </div>
            <span
              className={`text-sm font-medium ${
                currentStep >= 1 ? "text-blue-600" : "text-gray-500"
              }`}
            >
              Basic Info
            </span>
          </div>
          <div
            className={`flex-1 h-px mx-4 transition-all duration-200 ${
              currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"
            }`}
          ></div>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                currentStep >= 2
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
            <span
              className={`text-sm font-medium ${
                currentStep >= 2 ? "text-blue-600" : "text-gray-500"
              }`}
            >
              Settings
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white h-full">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="px-4 py-4">
            <div className="w-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">1</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-600">
                    Basic Information
                  </h2>
                  <p className="text-gray-600">
                    Tell people what your razzle is about
                  </p>
                </div>
              </div>

              <div className="form-content">
                {/* Image Upload */}
                <div className="mb-5">
                  <label className="block text-[1rem] font-semibold text-blue-600 mb-2">
                    Razzle Image <span className="text-red-500">*</span>
                  </label>
                  {preview ? (
                    <div className="relative group bg-gray-100 rounded-sm w-full h-48 flex items-center justify-center overflow-hidden">
                      <img
                        src={preview}
                        alt="Preview"
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute z-10 top-4 right-4 cursor-pointer bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-all duration-200 shadow-xl"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-opacity-10 transition-all duration-200 rounded-sm"></div>
                    </div>
                  ) : (
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-sm p-4 text-center cursor-pointer transition-all duration-200 ${
                        isDragActive
                          ? "border-blue-500 bg-blue-50 scale-[1.02]"
                          : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <UploadCloud className="h-8 w-8 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-700 mb-1">
                            {isDragActive
                              ? "Drop your image here"
                              : "Upload an image"}
                          </p>
                          <p className="text-sm text-gray-500">
                            JPEG, PNG, WEBP • Max 5MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {errors.raffle_image && (
                    <p className="text-sm text-red-600 mt-3 flex items-center gap-2">
                      <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">
                        !
                      </span>
                      {errors.raffle_image}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    A good image helps attract more participants. Show what they
                    could win or create excitement about your razzle.
                  </p>
                </div>
                {/* Title */}
                <div className="mb-5">
                  <label className="block text-[1rem] font-semibold text-blue-600 mb-2">
                    Razzle Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Win an iPhone 15 Pro Max!"
                    className="w-full px-4 py-4 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-[1rem]"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-3 flex items-center gap-2">
                      <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">
                        !
                      </span>
                      {errors.title}
                    </p>
                  )}
                  {apiErrors.title && (
                    <p className="text-sm text-red-600 mt-3 flex items-center gap-2">
                      <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">
                        !
                      </span>
                      {apiErrors.title.join(", ")}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-3">
                    Make it exciting! A catchy title gets more people
                    interested.
                  </p>
                </div>
                {/* Description */}
                <div>
                  <label className="block text-[1rem] font-semibold text-blue-600 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe what you're razzling, why it's awesome, and any important details participants should know..."
                    rows={6}
                    className="w-full px-4 py-4 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 text-[1rem]"
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-3 flex items-center gap-2">
                      <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">
                        !
                      </span>
                      {errors.description}
                    </p>
                  )}
                  {apiErrors.description && (
                    <p className="text-sm text-red-600 mt-3 flex items-center gap-2">
                      <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">
                        !
                      </span>
                      {apiErrors.description.join(", ")}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-3">
                    Be detailed! Explain what you're offering, condition, value,
                    and any rules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Settings */}
        {currentStep === 2 && (
          <div className="px-4 py-4">
            <div className="w-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">
                    2
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-600">
                    Razzle Settings
                  </h2>
                  <p className="text-gray-600">
                    Configure how your razzle works
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Basic Settings Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Number of Spots */}
                  <div>
                    <label className="block text-[1rem] font-semibold text-blue-600 mb-4">
                      Total Spots <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={10}
                        value={formData.spots_count}
                        onChange={(e) =>
                          handleInputChange(
                            "spots_count",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-4 py-4 pr-16 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[1rem]"
                      />
                      <div className="absolute right-4 top-4 text-gray-500 text-sm font-medium">
                        spots
                      </div>
                    </div>
                    {errors.spots_count && (
                      <p className="text-sm text-red-600 mt-3 flex items-center gap-2">
                        <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">
                          !
                        </span>
                        {errors.spots_count}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-3">
                      More spots = more participants, but takes longer to fill.
                      Minimum 10 spots.
                    </p>
                  </div>

                  {/* Draw Days */}
                  <div>
                    <label className="block text-[1rem] font-semibold text-blue-600 mb-4">
                      Draw in (days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.draw_days}
                      onChange={e => handleInputChange("draw_days", e.target.value)}
                      className="w-full px-4 py-4 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[1rem]"
                    />
                    <p className="text-sm text-gray-600 mt-3">
                      {formData.draw_days !== "" && Number(formData.draw_days) < 5 && (
                        <span className="text-red-600">Draw days must be at least 5.</span>
                      )}
                      Draw Date: <span className="font-semibold">{(() => {
                        const days = Number(formData.draw_days);
                        if (!isNaN(days) && days >= 5) {
                          const date = new Date();
                          date.setDate(date.getDate() + days);
                          return date.toLocaleString();
                        }
                        return "Select at least 5 days";
                      })()}</span>
                    </p>
                  </div>
                </div>

                {/* Razzle Type Toggle */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-sm p-4 border border-indigo-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl text-blue-600">
                          {formData.type === "fixed" ? <Bolt /> : <Clock />}
                        </span>
                        <h3 className="font-bold text-blue-600">
                          {formData.type === "fixed"
                            ? "Fixed Razzle"
                            : "Open Razzle"}
                        </h3>
                      </div>
                      <p className="text-base text-gray-700 mb-4">
                        {formData.type === "fixed"
                          ? "The number of spots is fixed."
                          : "The number of spots is dynamic and keeps increasing until the draw."}
                      </p>
                      <div
                        className={`text-sm px-3 py-2 rounded-sm inline-block font-medium ${
                          formData.type === "fixed"
                            ? "text-blue-700 bg-blue-100"
                            : "text-blue-700 bg-blue-100"
                        }`}
                      >
                        {formData.type === "fixed"
                          ? "Quick & Predictable"
                          : "Exciting & Dynamic"}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={formData.type === "fixed"}
                        onChange={(e) =>
                          handleInputChange(
                            "type",
                            e.target.checked ? "fixed" : "open"
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bookend Bonus */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-sm p-4 border border-yellow-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xl text-blue-600">
                            <Target className="w-5 h-5" />
                          </span>
                          <h3 className="font-bold text-blue-600">
                            Bookend Bonus
                          </h3>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          Combine the first and last spots as one special entry.
                          Not available in Open Razzles !
                        </p>
                        <div className="text-xs text-yellow-700 bg-yellow-100 px-3 py-1 rounded-sm inline-block font-medium">
                          Popular feature • Increases engagement
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={formData.ends_enabled}
                          onChange={(e) => handleInputChange("ends_enabled", e.target.checked)}
                          className="sr-only peer"
                          disabled={formData.type === "open"}
                        />
                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${formData.ends_enabled ? 'peer-checked:bg-yellow-500' : ''}`}></div>                    
                      </label>
                    </div>
                    {bookendError && (
                      <p className="text-sm text-red-600 mt-3 flex items-center gap-2">
                        <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">!</span>
                        {bookendError}
                      </p>
                    )}
                  </div>

                  {/* Privacy Setting */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-sm p-4 border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xl text-blue-600">
                            {formData.is_private ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                          </span>
                          <h3 className="font-bold text-blue-600">
                            {formData.is_private
                              ? "Private Razzle"
                              : "Public Razzle"}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          {formData.is_private
                            ? "All players are anonymous to each other."
                            : "All players can see each others profile pictures and names."}
                        </p>
                        <div
                          className={`text-xs px-3 py-1 rounded-sm inline-block font-medium ${
                            formData.is_private
                              ? "text-blue-700 bg-blue-100"
                              : "text-green-700 bg-green-100"
                          }`}
                        >
                          {formData.is_private
                            ? "Ananomous"
                            : "Social"}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={formData.is_private}
                          onChange={(e) =>
                            handleInputChange("is_private", e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Auto Delete Feature */}
                  {/* Auto-Cleanup removed, always 30 days by default */}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {(successMessage || creditError || apiErrors.general) && (
          <div className="px-4 py-4">
            <div className="w-full">
              {/* Success Message */}
              {successMessage && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xl">✓</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-green-900 mb-2 text-lg">
                        Razzle Created Successfully!
                      </h3>
                      <p className="text-green-700 mb-4">
                        {successMessage.message}
                      </p>
                      {successMessage.razzleId && (
                        <div className="flex flex-wrap gap-3">
                          <span className="text-sm text-green-600 bg-green-100 px-4 py-4 rounded-full font-medium">
                            ID: {successMessage.razzleId}
                          </span>
                          <button
                            type="button"
                            className="text-sm bg-green-600 text-white px-4 py-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                            onClick={() =>
                              navigate(`/razzles/${successMessage.razzleId}`)
                            }
                          >
                            View Your Razzle →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* General API Errors */}
              {apiErrors.general && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xl">!</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-red-900 mb-2 text-lg">
                        Something went wrong
                      </h3>
                      <p className="text-red-700">{apiErrors.general}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-4 py-4">
          <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              {/* Left: Help text */}
              <div className="text-sm text-gray-600 text-center md:text-left">
                <span className="font-medium">Need help?</span> Check our{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  razzle guidelines
                </a>
              </div>

              {/* Right: Buttons */}
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="w-full md:w-auto px-4 py-4 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 font-medium flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-4 py-4 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || loadingCredits}
                  onClick={currentStep === 2 ? handleLaunch : undefined}
                  className="w-full md:w-auto px-4 py-4 bg-blue-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loadingCredits ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      Loading Credits...
                    </>
                  ) : isSubmitting ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      Creating Your Razzle...
                    </>
                  ) : currentStep === 1 ? (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>Save Razzle</>
                  )}
                </button>
                {/* Modal */}
                {showModal && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-auto max-h-[90vh] p-6 relative overflow-y-auto mx-4">
                      {/* Close button */}
                      <button
                        onClick={() => setShowModal(false)}
                        className="absolute top-4 right-4 text-blue-500 hover:text-blue-700 cursor-pointer z-10"
                      >
                        <X className="h-6 w-6" />
                      </button>

                      <h2 className="text-2xl font-bold text-blue-600 mb-6 flex items-center gap-2">
                        <Rocket className="w-6 h-6 text-blue-600" />
                        Ready to Launch Your Razzle?
                      </h2>
                      {/* Razzle Preview Summary */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <h3 className="font-semibold text-blue-600 mb-3">Razzle Summary</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-600">Title:</span><span className="font-medium">{formData.title}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Total Spots:</span><span className="font-medium">{formData.spots_count} spots</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Type:</span><span className="font-medium">{formData.type === 'fixed' ? 'Fixed Razzle' : 'Open Razzle'}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Privacy:</span><span className="font-medium">{formData.is_private ? 'Private' : 'Public'}</span></div>
                          {formData.draw_days && Number(formData.draw_days) >= 5 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Draw Date:</span>
                              <span className="font-medium">{(() => { const date = new Date(); date.setDate(date.getDate() + Number(formData.draw_days)); return date.toLocaleDateString(); })()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Credit Information */}
                      {!creditError && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-sm font-bold">💳</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-blue-900 mb-2">Credit Deduction</h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center"><span className="text-blue-700">Credits Required:</span><span className="font-bold text-blue-900">{formData.spots_count} credits</span></div>
                                <div className="flex justify-between items-center"><span className="text-blue-700">Your Current Balance:</span><span className="font-bold text-blue-900">{userCredits} credits</span></div>
                                <div className="flex justify-between items-center pt-2 border-t border-blue-200"><span className="text-blue-700">Balance After Launch:</span><span className="font-bold text-blue-900">{userCredits - formData.spots_count} credits</span></div>
                              </div>
                              <p className="text-xs text-blue-600 mt-3 bg-blue-100 px-3 py-2 rounded-lg">💡 <strong>1 spot = 1 credit</strong> - Credits are deducted when you launch your razzle</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {creditError && (
                        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 mb-6">
                          <h3 className="font-semibold text-red-900 mb-2">Insufficient Balance</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center"><span className="text-red-700">Credits Required:</span><span className="font-bold text-red-900">{creditError.requiredBalance} credits</span></div>
                            <div className="flex justify-between items-center"><span className="text-red-700">Your Current Balance:</span><span className="font-bold text-red-900">{creditError.balance} credits</span></div>
                            <div className="flex justify-between items-center pt-2 border-t border-red-200"><span className="text-red-700">Shortfall:</span><span className="font-bold text-red-900">{creditError.requiredBalance - creditError.balance} credits</span></div>
                          </div>
                          <p className="text-xs text-red-600 mt-3 bg-red-100 px-3 py-2 rounded-lg">You do not have enough credits to launch this razzle. You can save it as a draft and launch later.</p>
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer font-semibold flex items-center gap-2"
                              onClick={() => navigate('/host-credits/buy')}
                            >
                              💳 Buy Credits
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          onClick={() => setShowModal(false)}
                          disabled={isSubmitting}
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-sm hover:bg-gray-300 transition cursor-pointer disabled:opacity-50 font-medium"
                        >
                          Cancel
                        </button>
                        {!creditError && (
                          <button
                            onClick={() => handleCreateRaffle(false)}
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 font-semibold flex items-center gap-2"
                          >
                            {isSubmitting ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                Launching...
                              </>
                            ) : (
                              <>
                                Launch ({formData.spots_count} credits)
                              </>
                            )}
                          </button>
                        )}
                      
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateRaffleForm;