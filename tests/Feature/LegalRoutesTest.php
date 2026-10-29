<?php

declare(strict_types=1);

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

final class LegalRoutesTest extends TestCase
{
    public function test_privacy_policy_page_loads_successfully(): void
    {
        $response = $this->get('/privacy');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Privacy')
        );
    }

    public function test_terms_of_service_page_loads_successfully(): void
    {
        $response = $this->get('/terms');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Terms')
        );
    }

    public function test_medical_disclaimer_page_loads_successfully(): void
    {
        $response = $this->get('/disclaimer');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Disclaimer')
        );
    }
}
