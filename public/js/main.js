$(function() {
  if($('textarea#ta').length) {
    CKEDITOR.replace('ta');
  }

  $('a.confirmdeletion').on('click', function() {
    if(!confirm('Confirm Deletion')) {
      return false;
    }
  });

  if($('[data-fancybox]').length)  {
    $('[data-fancybox]').fancybox();
  }
});
