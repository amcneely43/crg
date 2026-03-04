<?php

class ReadingsPage extends Page 
{
  public function currentlyReading() {
    return $this->children()->listed()->filterBy('intendedTemplate', 'reading')->filter(function ($reading) {
      return $reading->current()->bool();
    });
  }

}