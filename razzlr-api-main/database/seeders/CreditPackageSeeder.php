<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\CreditPackage;

class CreditPackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            ['name'=>'50 Credits','credits'=>50,'price_cents'=>500,'currency'=>'USD'],
            ['name'=>'100 Credits','credits'=>100,'price_cents'=>900,'currency'=>'USD'],
            ['name'=>'200 Credits','credits'=>200,'price_cents'=>1700,'currency'=>'USD'],
        ];

        foreach ($packages as $pkg) {
            CreditPackage::updateOrCreate(
                ['credits' => $pkg['credits']],
                $pkg
            );
        }
    }
}
