---
title: Gists
layout: collection
permalink: /gists/
collection: gists
entries_layout: grid
---

<!-- Listing for the collection `_gists`.-->

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">

    <!-- Let Jekyll handle the title/description via Front Matter -->
    <title>{{ page.title | default: site.title }}</title>
    <meta name="description" content="{{ page.description | default: site.description }}">

    <!-- Link to your main site CSS (if inheriting layout) -->
    <!-- <link rel="stylesheet" href="{{ '/assets/css/main.css' | relative_url }}"> -->

    <!-- Link to the Gist Viewer's Original CSS -->
    <link rel="stylesheet" href="{{ '/assets/css/gist-viewer/github-corner.css' | relative_url }}">
    <link rel="stylesheet" href="{{ '/assets/css/gist-viewer/styles.css' | relative_url }}">

    <!-- Link to YOUR custom Gist Viewer theme CSS (Create this file in Step 5) -->
    <link rel="stylesheet" href="{{ '/assets/css/gist-viewer-theme.css' | relative_url }}">

    <!-- Defer loading the Vue App JS -->
    <script defer type="module" src="{{ '/assets/js/gist-viewer/main.js' | relative_url }}"></script>


    <!-- Optional: Include your site's header here if NOT using layout: default -->
    <!-- {% include header.html %} -->

    <!-- This is where the main content from gists.md will be rendered by Jekyll -->
    <!-- We often use {{ content }} in layouts, but the Vue app replaces #app -->
    <!-- So, put static intro content directly in gists.md -->

    <main class="gist-viewer-main"> <!-- Added a class for easier scoping -->
        {{ content }} <!-- Renders markdown content from gists.md -->

        <div id="app">
            <!-- Vue app will mount here. Provide static fallback content for SEO/No-JS -->
            <p>Loading Gists...</p>
            <!-- You could potentially list a few key gists here manually for SEO -->
        </div>

        <noscript>Please enable JavaScript or switch to a modern browser version.</noscript>

        <!-- Keep the "About" section from the original index.html if desired -->
         <!-- You can move this into gists.md as markdown instead -->
        <!--
        <h2>About</h2>
        <p>
            This project is open-sourced...
        </p>
        -->
    </main>

    <!-- Optional: Include your site's footer here if NOT using layout: default -->
    <!-- {% include footer.html %} -->
