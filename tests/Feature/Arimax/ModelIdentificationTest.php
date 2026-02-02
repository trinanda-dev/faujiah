<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page when visiting arimax model identification', function () {
    $this->get(route('arimax.model-identification'))
        ->assertRedirect(route('login'));
});

test('authenticated users can visit arimax model identification page', function () {
    $this->actingAs(User::factory()->create());

    $this->get(route('arimax.model-identification'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Arimax/ModelIdentification'));
});




