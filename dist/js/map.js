let popupLightbox = null;

/*==========================================================================
Map script
============================================================================*/
function loadYandexMaps() {
   return new Promise((resolve, reject) => {

      if (window.ymaps) {
         resolve();
         return;
      }

      const script = document.createElement('script');

      script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
      script.async = true;

      script.onload = resolve;
      script.onerror = reject;

      document.head.appendChild(script);

   });
}

/*==========================================================================
Observer
============================================================================*/
const geoSection = document.querySelector('.geo');

let mapInitialized = false;

const observer = new IntersectionObserver(async ([entry]) => {

   if (!entry.isIntersecting || mapInitialized) return;

   mapInitialized = true;

   await loadYandexMaps();

   initMap();

   observer.disconnect();

}, {
   rootMargin: '500px'
});

if (geoSection) {
   observer.observe(geoSection);
}

/*==========================================================================
Map
============================================================================*/
async function initMap() {

   const projects = await fetch('./files/projects.json')
      .then(response => response.json());
   await ymaps.ready();

   const popup = document.querySelector('.geo__popup');
   const popupTitle = document.querySelector('.geo__popup-title');
   const popupAddress = document.querySelector('.geo__popup-address');
   const popupGallery = document.querySelector('.geo__popup-gallery');
   const popupClose = document.querySelector('.geo__popup-close');

   function openPopup(project) {
      popupTitle.textContent = project.title;
      popupAddress.textContent = project.address;
      popupGallery.innerHTML = project.images.map(image => `
      <a href="${image}" class="geo__popup-image geo-lightbox">
         <img src="${image}" alt="${project.title}">
      </a>
   `)
         .join("");
      popupLightbox?.destroy();

      popupLightbox = GLightbox({
         selector: '.geo-lightbox'
      });
      popup.classList.add('show');
   }

   function closePopup() {
      popup.classList.remove('show');

      const bounds = ymaps.geoQuery(
         placemarks.map(item => item.placemark)
      ).getBounds();

   }

   const map = new ymaps.Map("map", {
      center: [61, 90],
      zoom: 7,
      controls: ["zoomControl"],
      options: {
         minZoom: 3,
         maxZoom: 10
      }
   });

   map.behaviors.disable('scrollZoom');

   const placemarks = [];

   projects.forEach(project => {

      const placemark = new ymaps.Placemark(
         project.coords,
         {},
         {
            iconLayout: 'default#image',
            iconImageHref: 'img/map-location.png',
            iconImageSize: [50, 60],
            iconImageOffset: [-25, -30]
         }
      );

      placemark.events.add('click', () => {

         openPopup(project);

         map.setCenter(
            project.coords,
            Math.max(map.getZoom(), 6),
            {
               duration: 500
            }
         );

      });

      map.geoObjects.add(placemark);

      placemarks.push({
         placemark,
         project
      });

   });

   map.events.add('click', closePopup);

   popupClose.addEventListener('click', e => {
      e.stopPropagation();
      closePopup();
   });


   const bounds = ymaps.geoQuery(
      placemarks.map(item => item.placemark)
   ).getBounds();

   map.setBounds(bounds, {
      checkZoomRange: true,
      zoomMargin: 80
   });

   map.events.once('boundschange', () => {

      const groundPane = document.querySelector('.ymaps-2-1-79-ground-pane');

      if (groundPane) {
         groundPane.style.filter = 'grayscale(60%)';
      }

   });

}