<?php

return function (Kirby\Cms\App $kirby, Kirby\Cms\Site $site, Kirby\Cms\Page $page) {
  $errors = [];
  $old = [];
  $success = false;

  // Helper: word count (robust across whitespace)
  $wordCount = function ($text) {
    $trim = trim(preg_replace('~\s+~u', ' ', (string)$text));
    if ($trim === '') return 0;
    return count(preg_split('~\s+~u', $trim));
  };

  if ($kirby->request()->is('POST')) {
    // CSRF + Honeypot
    if (!Csrf::check(get('csrf'))) {
      $errors['form'] = 'Security check failed. Please try again.';
    }
    if (get('website')) { // honeypot field must be empty
      $errors['form'] = 'Security check failed.';
    }

    // Gather inputs
    $old = [
      'name'     => trim(get('name')),
      'email'    => trim(get('email')),
      'title'    => trim(get('title')),
      'abstract' => trim(get('abstract')),
      'url'      => trim(get('url')),
      'relevance'=> trim(get('relevance')),
      'consent'  => get('consent') === 'on' ? 'on' : '',
    ];

    // Validate required
    if ($old['name'] === '')       $errors['name'] = 'Please enter your full name.';
    if (!V::email($old['email'] ?? '')) $errors['email'] = 'Please enter a valid email address.';
    if ($old['title'] === '')      $errors['title'] = 'Please add a project or paper title.';
    if ($old['abstract'] === '')   $errors['abstract'] = 'Please include a brief abstract (200 words or fewer).';
    if ($wordCount($old['abstract']) > 200) $errors['abstract'] = 'Please include a brief abstract (200 words or fewer).';
    if ($old['consent'] !== 'on')  $errors['consent'] = 'Please check the box to continue.';

    // URL / File rule: at least one
    $hasUrl  = $old['url'] !== '';
    $hasFile = isset($_FILES['file']) && ($_FILES['file']['error'] !== UPLOAD_ERR_NO_FILE);
    if (!$hasUrl && !$hasFile) {
      $errors['linkOrFile'] = 'Please provide at least one—either a URL or a PDF.';
    }

    // URL validation (if provided)
    if ($hasUrl && !V::url($old['url'])) {
      $errors['url'] = 'Please enter a valid URL (starting with http or https).';
    }

    // File checks (if provided)
    $uploadedFile = null;
    if ($hasFile && empty($errors)) {
      if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $errors['file'] = 'Please upload a PDF (10 MB max).';
      } else {
        $tmp  = $_FILES['file']['tmp_name'];
        $size = (int)$_FILES['file']['size'];
        $name = $_FILES['file']['name'];
        $ext  = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if ($ext === 'pdf' && $size <= 10 * 1024 * 1024) {
          $uploadedFile = [
            'tmp'  => $tmp,
            'name' => $name,
          ];
        } else {
          $errors['file'] = 'Please upload a PDF (10 MB max).';
        }
      }
    }

    // If valid, persist + email
    if (empty($errors)) {
      // Ensure /submissions/entries container exists (optional; Panel can create too)
      $entries = $page->children()->find('entries');
      if (!$entries) {
        $entries = Page::create([
          'slug' => 'entries',
          'template' => 'default',
          'parent' => $page,
          'content' => ['title' => 'Entries']
        ]);
      }

      // Create entry page
      $slug = Str::slug(date('Ymd-His') . '-' . Str::short($old['title'], 80));
      $entry = Page::create([
        'slug' => $slug,
        'template' => 'default',
        'parent' => $entries,
        'content' => [
          'title'     => $old['title'],
          'name'      => $old['name'],
          'email'     => $old['email'],
          'abstract'  => $old['abstract'],
          'url'       => $old['url'],
          'relevance' => $old['relevance'],
          'consent'   => 'yes',
          'created'   => date('c'),
        ],
      ]);

      // Move file into entry (if provided)
      $storedFileName = null;
      if ($uploadedFile) {
        $stored = $entry->createFile([
          'source' => $uploadedFile['tmp'],
          'filename' => Str::slug(pathinfo($uploadedFile['name'], PATHINFO_FILENAME)) . '.pdf',
        ]);
        $storedFileName = $stored ? $stored->filename() : null;
      }

      // Email
      $to = 'communityreadinggroup@gmail.com';
      $subject = '[CRG Submissions] ' . $old['title'] . ' — ' . $old['name'];
      $body = implode("\n", [
        "Name: {$old['name']}",
        "Email: {$old['email']}",
        "Title: {$old['title']}",
        "URL: " . ($old['url'] ?: '(none)'),
        "File: " . ($storedFileName ?: ($uploadedFile ? '(upload failed to store)' : '(none)')),
        "Abstract:\n{$old['abstract']}",
        "",
        "Relevance:\n" . ($old['relevance'] ?: '(none)'),
        "",
        "Entry: " . $entry->url(),
      ]);

      try {
        kirby()->email([
          'to'      => $to,
          'subject' => $subject,
          'body'    => $body,
        ]);
      } catch (Throwable $e) {
        // Non-fatal; still consider success since data is stored
      }

      $success = true;
      $old = []; // clear form
    }
  }

  return compact('errors', 'old', 'success');
};
