/* global $ */


$(document).ready(function () {
  window.GOVUKFrontend.initAll();

  var xhr;

  $(document).on('change','.govuk-file-upload', function () {
    var documentPathArray = $(this).val().split('\\');

    $('.upload-status__title').html(documentPathArray[documentPathArray.length -1]);
    $('.upload-status').show();
    $('.upload-status-heading').show();
    $('.upload-status__link').show();
    $('#fileUploadDiv').hide();
    $('#errorSummaryDiv').empty();
    $('#fileUploadDiv .govuk-file-upload--error').removeClass('govuk-file-upload--error');
    $('#fileUploadDiv .govuk-form-group--error').removeClass('govuk-form-group--error');
    $('#file-upload-error').remove();

    var formData = new FormData();
    var file = document.getElementById('file-upload').files[0];
    formData.append('file-upload', file);
    xhr = new XMLHttpRequest();
    xhr.open('post', '/extensions/evidence-upload', true);
    xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');

    xhr.upload.onprogress = function(e) {
      if (e.lengthComputable) {
        var percentage = Math.round((e.loaded / e.total) * 100);
        $('.indicator').width(percentage + '%');
        $('.upload-status__value').html(percentage + '% uploaded');
        if (percentage === 100) {
          $('.upload-status__link').hide()
        }
      }
    };

    xhr.onerror = function(e) {
      window.location.href = '/extensions/error';
    };

    xhr.onload = function() {
      if (xhr.response) {
        var responseJSON = JSON.parse(xhr.response);

        if (responseJSON.redirect) {
          window.location.href = responseJSON.redirect;
        } else {
          $('.upload-status').hide();
          $('.indicator').width('0');
          $('.upload-status__value').html('0');
          $('.upload-status-heading').hide();

          if (responseJSON.divs) {
            responseJSON.divs.forEach(function(element) {
              var div = $('#' + element.divId);
              div.html(element.divHtml);
              div.show();
            });
          }
        }
      }
    };

    xhr.send(formData);
  });

  $('.upload-status__link').click(function () {
    if (xhr) {
      xhr.abort();
    }
    $('.indicator').stop();
    $('.upload-status').hide();
    $('.indicator').width('0');
    $('.upload-status__value').html('0');
    $('.upload-status-heading').hide();
    $('#fileUploadDiv').show();
    $('.govuk-file-upload').val('');
    return false
  })
});
