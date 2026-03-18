<div class="notice">
    <div>
      <h3>
        <a href="<?= $weaving->url()?>">
          <span class="uppercase"><?= $weaving -> title() ?>&nbsp;
          <?= $weaving-> subtitle() ?></span>  
        </a>
      </h3>
    </div>
    <?php if($mast): ?>
      <div class="m-hide">
        <h3><a href="<?= $weaving -> find('mast') -> url()?>">About</a></h3>
      </div>
    <?php endif ?>
  </div> 