<?php snippet('nav') ?>

<main class="page submissions triptych">
  <article class="content-column">
    <h1><?= html($page->title()) ?></h1>

    <?php if ($success): ?>
      <div class="notice success" tabindex="-1">
        <?= nl2br(html($page->success_message()->or('Thanks for submitting to CRG. We review proposals monthly and will reach out if we plan to schedule your work or need more information. If you need to update or withdraw your submission, email us at ' . $site->newsletterEmail()->value() . '.'))) ?>
      </div>
    <?php else: ?>
      <div class="intro">
        <?= kirbytext($page->intro()) ?>
      </div>

      <?php if (isset($errors['form'])): ?>
        <div class="notice error" role="alert"><?= esc($errors['form']) ?></div>
      <?php endif; ?>

      <?php if (!empty($errors)): ?>
        <div class="notice error" role="alert">
          Please correct the errors below.
        </div>
      <?php endif; ?>

      <form method="post" enctype="multipart/form-data" novalidate>
        <!-- Honeypot -->
        <input type="text" name="website" value="" style="position:absolute;left:-9999px;" tabindex="-1" autocomplete="off" aria-hidden="true">

        <div class="field">
          <label for="name">Full name *</label>
          <input id="name" name="name" type="text" required value="<?= esc($old['name'] ?? '') ?>">
          <?php if (isset($errors['name'])): ?><div class="error"><?= esc($errors['name']) ?></div><?php endif; ?>
        </div>

        <div class="field">
          <label for="email">Email *</label>
          <input id="email" name="email" type="email" required value="<?= esc($old['email'] ?? '') ?>">
          <?php if (isset($errors['email'])): ?><div class="error"><?= esc($errors['email']) ?></div><?php endif; ?>
        </div>

        <div class="field">
          <label for="title">Project / paper title *</label>
          <input id="title" name="title" type="text" required value="<?= esc($old['title'] ?? '') ?>">
          <?php if (isset($errors['title'])): ?><div class="error"><?= esc($errors['title']) ?></div><?php endif; ?>
        </div>

        <div class="field">
          <label for="abstract">Abstract (≤200 words) *</label>
          <textarea id="abstract" name="abstract" rows="6" required><?= esc($old['abstract'] ?? '') ?></textarea>
          <?php if (isset($errors['abstract'])): ?><div class="error"><?= esc($errors['abstract']) ?></div><?php endif; ?>
        </div>

        <div class="field">
          <label for="url">Link to materials (URL)</label>
          <input id="url" name="url" type="url" placeholder="https://…" value="<?= esc($old['url'] ?? '') ?>">
          <?php if (isset($errors['url'])): ?><div class="error"><?= esc($errors['url']) ?></div><?php endif; ?>
        </div>

        <div class="field">
          <label for="file">Or upload a PDF (10 MB max)</label>
          <input id="file" name="file" type="file" accept="application/pdf">
          <?php if (isset($errors['file'])): ?><div class="error"><?= esc($errors['file']) ?></div><?php endif; ?>
        </div>

        <?php if (isset($errors['linkOrFile'])): ?>
          <div class="error"><?= esc($errors['linkOrFile']) ?></div>
        <?php endif; ?>

        <div class="field">
          <label for="relevance">Relevance note (optional)</label>
          <textarea id="relevance" name="relevance" rows="4"><?= esc($old['relevance'] ?? '') ?></textarea>
        </div>

        <div class="field checkbox">
          <label>
            <input type="checkbox" name="consent" <?= isset($old['consent']) && $old['consent']==='on' ? 'checked' : '' ?>>
            By submitting, you consent to CRG storing your information and materials for internal review for up to 12 months. We will not share your submission publicly without your permission. You can request deletion at any time by emailing <?= $site->newsletterEmail()->value() ?>.
          </label>
          <?php if (isset($errors['consent'])): ?><div class="error"><?= esc($errors['consent']) ?></div><?php endif; ?>
        </div>

        <?php if (function_exists('csrf')): ?>
  <input type="hidden" name="_csrf" value="<?= csrf() ?>">
<?php endif ?>

<div class="actions">
  <button type="submit">Submit to CRG</button>
</div>
</form>
<?php endif; ?>

  </article>
</main>

<?php snippet('footer') ?>
