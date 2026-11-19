// Dummy transaction history data
export const credit_transactions = [
  {
    id: 17,
    transaction_id: "d7a5eedc-075e-4a1c-806f-0dd102e355d9",
    user_id: "1",
    raffle_id: null,
    type: "purchase",
    payment_status: "paid",
    credits: 50,
    amount: "500",
    currency: "USD",
    stripe_payment_intent_id: "pi_3Rurzf03XKHXJnjO09E6pkGy",
    created_at: "2025-08-11T09:24:05.000000Z",
    updated_at: "2025-08-11T09:26:18.000000Z"
  },
  {
    id: 16,
    transaction_id: "527f7fba-5faf-4b5b-ba3b-19094109613d",
    user_id: "1",
    raffle_id: null,
    type: "purchase",
    payment_status: "unpaid",
    credits: 50,
    amount: "500",
    currency: "USD",
    stripe_payment_intent_id: null,
    created_at: "2025-08-11T09:22:50.000000Z",
    updated_at: "2025-08-11T09:22:50.000000Z"
  },
  {
    id: 15,
    transaction_id: "f5596a11-9bf2-4b29-9a34-fb1f95b17093",
    user_id: "1",
    raffle_id: null,
    type: "purchase",
    payment_status: "unpaid",
    credits: 100,
    amount: "900",
    currency: "USD",
    stripe_payment_intent_id: null,
    created_at: "2025-08-11T09:19:39.000000Z",
    updated_at: "2025-08-11T09:19:40.000000Z"
  },
  {
    id: 13,
    transaction_id: "d16bc987-66d9-410f-82e1-d7fc9228d367",
    user_id: "1",
    raffle_id: "7",
    type: "spend",
    payment_status: "paid",
    credits: 20,
    amount: null,
    currency: "USD",
    stripe_payment_intent_id: null,
    created_at: "2025-08-05T16:54:03.000000Z",
    updated_at: "2025-08-05T16:54:03.000000Z"
  },
  {
    id: 12,
    transaction_id: "7d57aace-10ac-4f88-88bd-017701ac50b1",
    user_id: "1",
    raffle_id: "6",
    type: "spend",
    payment_status: "paid",
    credits: 10,
    amount: null,
    currency: "USD",
    stripe_payment_intent_id: null,
    created_at: "2025-08-01T11:42:35.000000Z",
    updated_at: "2025-08-01T11:42:35.000000Z"
  },
  {
    id: 10,
    transaction_id: "71fa7e37-158e-4833-be34-aba1a0e72fa4",
    user_id: "1",
    raffle_id: "5",
    type: "spend",
    payment_status: "paid",
    credits: 14,
    amount: null,
    currency: "USD",
    stripe_payment_intent_id: null,
    created_at: "2025-07-29T15:21:44.000000Z",
    updated_at: "2025-07-29T15:21:44.000000Z"
  },
  {
    id: 9,
    transaction_id: "a8d3768f-ea32-4ac6-a3d1-52031c93481e",
    user_id: "1",
    raffle_id: null,
    type: "purchase",
    payment_status: "paid",
    credits: 50,
    amount: "500",
    currency: "USD",
    stripe_payment_intent_id: "pi_3RqFK203XKHXJnjO0pPAvpLo",
    created_at: "2025-07-29T15:18:51.000000Z",
    updated_at: "2025-07-29T15:20:13.000000Z"
  },
  {
    id: 8,
    transaction_id: "143fc3ef-105c-4ca9-8c63-116d08f26dd3",
    user_id: "1",
    raffle_id: "4",
    type: "spend",
    payment_status: "paid",
    credits: 10,
    amount: null,
    currency: "USD",
    stripe_payment_intent_id: null,
    created_at: "2025-07-29T14:11:07.000000Z",
    updated_at: "2025-07-29T14:11:07.000000Z"
  },
  {
    id: 7,
    transaction_id: "9edd0e61-5ba3-4098-82d9-7554c5299bdc",
    user_id: "1",
    raffle_id: "3",
    type: "spend",
    payment_status: "paid",
    credits: 10,
    amount: null,
    currency: "USD",
    stripe_payment_intent_id: null,
    created_at: "2025-07-29T13:41:56.000000Z",
    updated_at: "2025-07-29T13:41:56.000000Z"
  },
  {
    id: 4,
    transaction_id: "b0cfa4dd-623e-4f45-95b6-5cbac92b5f0e",
    user_id: "1",
    raffle_id: "1",
    type: "spend",
    payment_status: "paid",
    credits: 3,
    amount: null,
    currency: "USD",
    stripe_payment_intent_id: null,
    created_at: "2025-07-29T12:48:24.000000Z",
    updated_at: "2025-07-29T12:48:24.000000Z"
  },
  {
    id: 3,
    transaction_id: "62fcc502-4c5d-4ea1-ab2a-ce0cfe1444ca",
    user_id: "1",
    raffle_id: "1",
    type: "spend",
    payment_status: "paid",
    credits: 14,
    amount: null,
    currency: "USD",
    stripe_payment_intent_id: null,
    created_at: "2025-07-29T12:22:54.000000Z",
    updated_at: "2025-07-29T12:22:54.000000Z"
  },
  {
    id: 1,
    transaction_id: "08120e52-237b-4f5a-bbdd-ad50c66a1601",
    user_id: "1",
    raffle_id: null,
    type: "purchase",
    payment_status: "paid",
    credits: 50,
    amount: "500",
    currency: "USD",
    stripe_payment_intent_id: "pi_3RqCWm03XKHXJnjO11ALd1zN",
    created_at: "2025-07-29T12:19:43.000000Z",
    updated_at: "2025-07-29T12:21:10.000000Z"
  }
];

import api from "./api";
import { getCookie } from '../utils/cookieUtils';

export async function fetchCreditPackages() {
  try {
    const token = getCookie('access_token');
    const response = await api.get('/list-credit-packages', {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function purchaseCredits(packageId) {
  try {
    const token = getCookie('access_token');
    const response = await api.post(
      '/purchase-credits',
      { package_id: packageId },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      }
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function fetchCreditTransactions(per_page, page, type, payment_status) {
  try {
    const token = getCookie('access_token');
    const response = await api.get('/credit-transactions', {
      params: {
        per_page,
        page,
        type,
        payment_status
      },
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
}