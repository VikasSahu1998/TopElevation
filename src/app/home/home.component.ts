import { Component, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { ApiService } from '../Server/api.service';
import { Note } from '../model';
import * as L from 'leaflet';
import html2canvas from 'html2canvas';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  longitude: any;
  latitude: any;
  constructor(private formbuilder: FormBuilder, private api: ApiService, private toastr: ToastrService) { }
  lat!: any;
  lng!: any;
  updatedDistance!: number;
  TopElevationForm!: FormGroup | any;
  checkbox = "form accepted";
  marker: any;
  marker2: any;
  line: any;
  generatedOTP!: any;
  otpSent: boolean = false;

  // map!: L.Map;
  // geojsonLayer!: L.GeoJSON;

  @ViewChild('map') mapElement!: ElementRef;

  noteObj: Note = {
    id: undefined,
    name: undefined,
    uniqueId: undefined,
    email: undefined,
    Address: undefined,
    PhoneNumber: undefined,
    otp: undefined,
    Latitude: undefined,
    Longitude: undefined,
    checkbox: undefined,
    dateTime: undefined,
    imageData: undefined,
    Site_Elevation: undefined
  }
  ngOnInit(): void {
    this.toastr.success('WelCome ✈️', 'Hey There..👋🏻', {
      timeOut: 3000,
    });
    this.TopElevationForm = this.formbuilder.group({
      name: new FormControl('', [Validators.required, Validators.nullValidator, Validators.minLength(3),]),
      email: new FormControl('', [Validators.required, Validators.nullValidator, Validators.email]),
      Address: new FormControl('', [Validators.required, Validators.nullValidator]),
      PhoneNumber: new FormControl('', [Validators.required, Validators.nullValidator, Validators.minLength(10), Validators.maxLength(10), Validators.pattern(/^[6789]\d{9}$/)]),
      otp: new FormControl('', [Validators.required, Validators.nullValidator, Validators.pattern(/^\d{4}$/)]),
      Latitude: new FormControl('', [Validators.required, Validators.nullValidator]),
      Longitude: new FormControl('', [Validators.required, Validators.nullValidator]),
      checkbox: new FormControl('', [Validators.required, Validators.nullValidator]),
      Site_Elevation: new FormControl('', [Validators.required, Validators.nullValidator, Validators.pattern(/^[0-5]+(?:\.[0-5]+)?$/)]),
      uniqueId: new FormControl(['']),
      dateTime: new FormControl(['']),
      imageData: new FormControl(['']),
    });
    this.TopElevationForm.get('Latitude').valueChanges.subscribe((lat: number) => {
      this.updateMarker2Position(lat, this.TopElevationForm.get('Longitude').value);
      this.updatePolyline(lat, this.TopElevationForm.get('Longitude').value);
    });

    this.TopElevationForm.get('Longitude').valueChanges.subscribe((lng: number) => {
      this.updateMarker2Position(this.TopElevationForm.get('Latitude').value, lng);
      this.updatePolyline(this.TopElevationForm.get('Latitude').value, lng);
    });
    this.generateUniqueId();
    this.getCurrentDateTime();
    this.getLocation();
  }

  generateUniqueId(): string {
    // Here, you can generate a unique ID using any method you prefer (e.g., UUID, timestamp, etc.)
    // For simplicity, let's generate a random number as the unique ID
    const uniqueId = Math.floor(Math.random() * 1000000).toString();
    this.TopElevationForm.get('uniqueId').setValue(uniqueId);
    return uniqueId;
  }

  getCurrentDateTime(): string {
    const dateTime = new Date().toLocaleString();
    this.TopElevationForm.get('dateTime').setValue(dateTime);
    return dateTime;
  }

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
        // this.mylatlng.lat = position.coords.latitude;
        // this.mylatlng.lng = position.coords.longitude;
        this.showMap(this.lat, this.lng);
      });
    } else {
      this.toastr.error('Geolocation is not supported by this browser', 'Major Error 🚨', {
        timeOut: 3000,
      });
    }
  }

  generateOTP() {
    // Generate a random 4-digit OTP
    this.generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
    // You can implement OTP sending logic here, like sending an SMS to the entered phone number

    this.toastr.success(this.generatedOTP, 'Generated OTP 💯', {
      timeOut: 5000,
    });
  }

  regenerateOtp() {
    const phoneNumberControl = this.TopElevationForm.get('PhoneNumber');
    if (phoneNumberControl && phoneNumberControl.valid) {
      this.generateOTP();
      this.otpSent = true;
    } else {
      this.otpSent = false;
    }
  }
  onPhoneNumberChange() {
    const phoneNumberControl = this.TopElevationForm.get('PhoneNumber');
    if (phoneNumberControl && phoneNumberControl.valid) {
      this.generateOTP();
      this.otpSent = true;
    } else {
      this.otpSent = false;
    }
  }

  verifyOtp() {
    if (this.TopElevationForm.valid) {
      const enteredOTP = this.TopElevationForm.get('otp').value;
      if (enteredOTP == this.generatedOTP) {
        // OTP verification successful
        this.toastr.success('OTP verification successfull', 'successfully 🎉', {
          timeOut: 1000,
        });
      } else {
        // OTP verification failed
        this.toastr.error('OTP verification failed', 'Major Error 🚨', {
          timeOut: 1000,
        });
      }
    }
  }

  onsubmit() {
    this.verifyOtp();
    this.captureScreenshot();
    const { value } = this.TopElevationForm;
    this.noteObj.id = value.uniqueId,
      this.noteObj.name = value.name,
      this.noteObj.email = value.email,
      this.noteObj.Address = value.Address,
      this.noteObj.PhoneNumber = value.PhoneNumber,
      this.noteObj.otp = value.otp,
      this.noteObj.Latitude = value.Latitude,
      this.noteObj.Longitude = value.Longitude,
      this.noteObj.checkbox = value.checkbox,
      this.noteObj.dateTime = value.dateTime
    this.noteObj.imageData = value.imageData;
    this.noteObj.Site_Elevation = value.Site_Elevation;
    if (this.TopElevationForm.valid) {
      this.api.postData(this.noteObj)
        .subscribe({
          next: (res) => {
            this.toastr.success(res, 'successfully 🎉', {
              timeOut: 1000,
            });
            this.TopElevationForm.reset();
          },
          error: (e) => {
            this.toastr.error(e, 'failed 🚨', {
              timeOut: 1000,
            });

          }
        })
    }
    else {
      this.toastr.error('Fill the Form Completely', 'failed 🚨', {
        timeOut: 1000,
      });
    }
  }

  ngAfterViewInit() {

    this.captureScreenshot();
  }
  captureScreenshot() {
    if (this.mapElement) {
      const mapContainer = this.mapElement.nativeElement;

      html2canvas(mapContainer).then(canvas => {
        // `canvas` now contains the screenshot of the OpenStreetMap.
        const imageData = canvas.toDataURL('image/png');

        // Update the form control 'imageData'
        this.TopElevationForm.get('imageData').setValue(imageData);
      }).catch(error => {
        console.error('🚨 Error capturing screenshot:', error);

      });
    } else {
      console.error('mapElement is undefined 🚨');

    }
  }




  showMap(lat: number, lng: number) {
    const map = L.map('map').setView([19.794444, 85.751111], 10);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="https://www.cognitivenavigation.com/">Cognitive Navigation Pvt. Ltd </a>'
    }).addTo(map);
    L.control.scale().addTo(map);

    // Define the marker icon
    const newIcon = L.icon({
      iconUrl: 'assets/marker_map_icon.png', // Path to your red icon
      iconSize: [38, 95],
      iconAnchor: [22, 94],
      popupAnchor: [-3, -76],
    });


    this.marker = L.marker([lat, lng]).addTo(map);
    this.marker2 = L.marker([19.794444, 85.751111]).addTo(map);
    this.line = L.polyline([[lat, lng], [19.794444, 85.751111]], { color: 'blue' }).addTo(map);

    // Load the custom layer JSON
    fetch('assets/Height.geojsonl.json')
      .then(response => response.json())
      .then(geojsonData => {

        const geojsonLayer = new L.GeoJSON(geojsonData, {
          style: (feature) => {
            if (!feature || !feature.properties || !feature.properties.Name) return {};
            const height = feature.properties.Name;
            let color = '';

            switch (height) {
              case '05.23':
                color = 'yellow';
                break;
              case '49.7':
                color = 'red';
                break;
              case '64.7':
                color = 'green';
                break;
              case '74.7':
                color = 'blue';
                break;
              case '59.7':
                color = 'pink';
                break;
              case '24.7':
                color = 'orange';
                break;
              case 'NOC_Req':
                color = 'brown';
                break;
              case 'Polygon 775':
                color = 'black';
                break;
            }

            return {
              color: color,
              weight: 0.5
            };
          },
          onEachFeature: (feature, layer) => {
            layer.on('click', (e) => {
              const { lat, lng } = e.latlng;
              this.latitude = lat;
              this.longitude = lng;

              if (this.marker) map.removeLayer(this.marker);
              if (this.line) map.removeLayer(this.line);

              // const siteElevationInput = this.TopElevationForm.get('Site_Elevation');
              // const siteElevation = siteElevationInput ? siteElevationInput.value : 0;
              // const result = parseFloat(feature.properties.Name) - siteElevation;
              this.marker = L.marker([lat, lng]).addTo(map);
              this.line = L.polyline([[lat, lng], [19.794444, 85.751111]], { color: 'blue' }).addTo(map);
              this.updatePolyline(lat, lng);
              this.TopElevationForm.get('Latitude').setValue(lat);
              this.TopElevationForm.get('Longitude').setValue(lng);
              this.updatedDistance = this.calculateDistance(lat, lng, 19.794444, 85.751111);
              // const popup = L.popup({ autoPan: false, offset: L.point(0, -30) }).setLatLng(e.latlng);
              // const popupContent = `Permissible Elevation: ${feature.properties.Name} ${feature.properties.details}<br>Permissible Height: ${result < 0 ? '-' : ''}${Math.abs(result).toFixed(3)}M <br>  Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}<br> Distance: ${this.updatedDistance.toFixed(2)} km`;
              // popup.setContent(popupContent);
              // popup.openOn(map);
              // Create HTML elements for displaying data
              // Clear previous data on the map
              const mapData = document.getElementById('mapData');
              if (mapData !== null) {
                  // Clear existing content and hide the container
                  mapData.innerHTML = '';
                  mapData.style.display = 'none';
              
                  const { lat, lng } = e.latlng;
                  this.latitude = lat;
                  this.longitude = lng;
              
                  const siteElevationInput = this.TopElevationForm.get('Site_Elevation');
                  const siteElevation = siteElevationInput ? siteElevationInput.value : 0;
                  const result = parseFloat(feature.properties.Name) - siteElevation;
              
                  // Update HTML content
                  mapData.innerHTML = `
                      <div>
                          Permissible Elevation: ${feature.properties.Name} ${feature.properties.details}<br>
                          Permissible Height: ${result < 0 ? '-' : ''}${Math.abs(result).toFixed(3)}M <br>
                          Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}<br>
                          Distance: ${this.updatedDistance.toFixed(2)} km
                      </div>`;
              
                  // Position the map data elements
                  mapData.style.display = 'block'; // Make it visible
                  mapData.style.bottom = '0'; // Adjust as necessary
                  mapData.style.right = '0'; // Adjust as necessary
                  mapData.style.backgroundColor = 'white';
                  mapData.style.padding = '10px';
                  mapData.style.borderRadius = '5px';
                  mapData.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
                  mapData.style.zIndex = '9999';
              }
              
            });
          }
        });
        geojsonLayer.addTo(map);

        // Handle click events on the map
        map.on('click', (e) => {
          // Check if the click is inside the GeoJSON layer
          const layers = geojsonLayer.getLayers();
          let clickedInside = false;
          layers.forEach(layer => {
            // Handle different feature types
            if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
              if (layer.getBounds().contains(e.latlng)) {
                clickedInside = true;
                return;
              }
            } else if (layer instanceof L.Marker) {
              if (layer.getLatLng().equals(e.latlng)) {
                clickedInside = true;
                return;
              }
            }
          });

          if (!clickedInside) {
            // If click is outside GeoJSON layer, show map data popup
            const { lat, lng } = e.latlng;
            this.latitude = lat;
            this.longitude = lng;

            if (this.marker) map.removeLayer(this.marker);
            if (this.line) map.removeLayer(this.line);

            this.marker = L.marker([lat, lng]).addTo(map);
            this.line = L.polyline([[lat, lng], [19.794444, 85.751111]], { color: 'blue' }).addTo(map);

            this.updatePolyline(lat, lng);
            this.TopElevationForm.get('Latitude').setValue(lat);
            this.TopElevationForm.get('Longitude').setValue(lng);
            this.updatedDistance = this.calculateDistance(lat, lng, 19.794444, 85.751111);

            // const popup = L.popup({ autoPan: false, offset: L.point(0, -30) }).setLatLng(e.latlng);
            // const popupContent = `Latitude: ${lat.toFixed(5)}, Longitude:${lng.toFixed(5)}<br> Distance: ${this.updatedDistance.toFixed(2)} km`;
            // popup.setContent(popupContent);
            // popup.openOn(map);
            const mapData = document.getElementById('mapData');
            if (mapData !== null) {
              mapData.innerHTML = '';

              const { lat, lng } = e.latlng;
              this.latitude = lat;
              this.longitude = lng;

         

              // Create HTML elements for displaying data
              mapData.innerHTML = `
                <div>
                
                  Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}<br>
                  Distance: ${this.updatedDistance.toFixed(2)} km
                </div>`;
            
                // Position the map data elements
                mapData.style.display = 'block'; // Make it visible
                mapData.style.bottom = '0'; // Adjust as necessary
                mapData.style.right = '0'; // Adjust as necessary
                mapData.style.backgroundColor = 'white';
                mapData.style.padding = '10px';
                mapData.style.borderRadius = '5px';
                mapData.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
                mapData.style.zIndex = '9999';
            }
          }
        });
      });
  }


  updateMarker2Position(lat: number, lng: number) {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    }
  }

  updatePolyline(lat: number, lng: number) {
    if (this.line) {
      this.line.setLatLngs([[lat, lng], [19.794444, 85.751111]]);
    }
  }


  calculateDistance(latitude1: number, longitude1: number, latitude2: number, longitude2: number): number {
    const earthRadius = 6371; // Radius of the Earth in kilometers
    const latitudeDiff = this.degToRad(latitude2 - latitude1);
    const longitudeDiff = this.degToRad(longitude2 - longitude1);
    const a =
      Math.sin(latitudeDiff / 2) * Math.sin(latitudeDiff / 2) +
      Math.cos(this.degToRad(latitude1)) * Math.cos(this.degToRad(latitude2)) *
      Math.sin(longitudeDiff / 2) * Math.sin(longitudeDiff / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    return distance;
  }

  degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}