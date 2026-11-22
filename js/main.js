(function(){
  var y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  var dlg=document.getElementById('viewer');
  if(dlg){
    var big=dlg.querySelector('img');
    document.querySelectorAll('.gal img').forEach(function(im){
      im.addEventListener('click',function(){big.src=im.src;big.alt=im.alt;dlg.showModal();});
    });
    dlg.addEventListener('click',function(e){if(e.target===dlg||e.target.tagName==='BUTTON')dlg.close();});
  }
})();
