import { Component, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { ApiService } from '../Server/api.service';
import * as L from 'leaflet';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  longitude: any;
  latitude: any;
  constructor(private formbuilder: FormBuilder, private api: ApiService) { }
  lat!: any;
  long!: any;
  updatedDistance!: number;
  TopElevationForm!: FormGroup | any;
  checkbox = "form accepted";

  generatedOTP!: any;
  otpSent: boolean = false;

  @ViewChild('map') mapElement!: ElementRef;

  ngOnInit(): void {
    this.TopElevationForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.nullValidator, Validators.minLength(3),]),
      email: new FormControl('', [Validators.required, Validators.nullValidator, Validators.email]),
      Address: new FormControl('', [Validators.required, Validators.nullValidator]),
      PhoneNumber: new FormControl('', [Validators.required, Validators.nullValidator, Validators.minLength(10), Validators.maxLength(10), Validators.pattern(/^\d{10}$/)]),
      otp: new FormControl('', [Validators.required, Validators.nullValidator, Validators.pattern(/^\d{4}$/)]),
      Latitude: new FormControl('', [Validators.required, Validators.nullValidator]),
      Longitude: new FormControl('', [Validators.required, Validators.nullValidator]),
      checkbox: new FormControl('', [Validators.required, Validators.nullValidator]),
      uniqueId: new FormControl(['']),
      dateTime: new FormControl(['']),
      imageData: new FormControl(['']),
    },);

    // this.findMe()
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
        this.long = position.coords.longitude;
        // this.mylatlng.lat = position.coords.latitude;
        // this.mylatlng.lng = position.coords.longitude;
        this.showMap(this.lat, this.long);
      });
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
  }


  generateOTP() {
    // Generate a random 4-digit OTP
    this.generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
    // You can implement OTP sending logic here, like sending an SMS to the entered phone number
    alert(`Generated OTP: ${this.generatedOTP}`);
    // console.log("Generated OTP: ", this.generatedOTP);
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
        alert("OTP verification successful");
        this.onsubmit();
      } else {
        // OTP verification failed
        alert("OTP verification failed");
      }
    }
  }

  onsubmit() {
    this.captureScreenshot()
    if (this.TopElevationForm.valid) {
      this.api.postData(this.TopElevationForm.value,)
        .subscribe({
          next: (res) => {

            alert("details added successfully");

            // this.toastr.success('details added successfully', 'successfully', { timeOut: 2000, });
            this.TopElevationForm.reset();
            // this.dialogref.close('save');
          },
          error: () => {
            alert("Major Error In Server");
            // this.toastr.error('everything is broken', 'Major Error In Server', { timeOut: 2000, });
          }
        })
    }
    else {
      alert("Fill the Form Completely");
    }
  }



  captureScreenshot() {
    const mapContainer = this.mapElement.nativeElement;

    html2canvas(mapContainer).then(canvas => {
      // `canvas` now contains the screenshot of the OpenStreetMap.
      // You can use it, save it, or send it to the server as needed.
      const imageData = canvas.toDataURL('image/png');
      this.TopElevationForm.patchValue({
        imageData: imageData,
      });
      console.log(imageData);
    });
  }

  showMap(lat: number, lng: number) {
    const map = L.map('map').setView([19.794444, 85.751111], 10);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="https://www.cognitivenavigation.com/">Cognitive Navigation Pvt. Ltd </a> '

    }).addTo(map);
    L.control.scale().addTo(map);

    const marker1 = L.marker([lat, lng]).addTo(map);
    const marker2 = L.marker([19.794444, 85.751111]).addTo(map);

    // Initialize the line with the initial coordinates
    const line = L.polyline([[lat, lng], [19.794444, 85.751111]], { color: 'blue' }).addTo(map);

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.latitude = lat;
      this.longitude = lng;
      marker1.setLatLng([lat, lng]);

      // Update the line coordinates
      line.setLatLngs([[lat, lng], [19.794444, 85.751111]]);

      // Set the values of Latitude and Longitude form controls
      this.TopElevationForm.get('Latitude').setValue(lat);
      this.TopElevationForm.get('Longitude').setValue(lng);

      // Calculate and display updated distance
      this.updatedDistance = this.calculateDistance(lat, lng, 19.794444, 85.751111);

      // Display the clicked location details
      const popup = L.popup();
      popup.setContent(`Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)},\n Distance: ${this.updatedDistance.toFixed(2)}km `);
      popup.setLatLng(e.latlng).openOn(map);
      popup.openOn(map);
    });

    // Load the custom layer JSON
    fetch('assets/Height.geojsonl.json')
      .then(response => response.json())
      .then(geojsonData => {
        const geojsonLayer = new L.GeoJSON(geojsonData, {
          style: function (feature) {
            if (!feature || !feature.properties || !feature.properties.Name) return {};
            const height = feature.properties.Name;
            let color = '';

            switch (height) {
              case 'RW_05_23':
                color = 'yellow';
                break;
              case '49.7M AMSL':
                color = 'red';
                break;
              case '64.7M AMSL':
                color = 'green';
                break;
              case '74.7M AMSL':
                color = 'blue';
                break;
              case '59.7M AMSL':
                color = 'pink';
                break;
              case '24.7M AMSL':
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
            };
          },

          onEachFeature: function (feature, layer) {
            if (feature.properties && feature.properties.Name) {
              layer.bindPopup(feature.properties.Name);
            }
          }
        });
        geojsonLayer.addTo(map);
      }
      );
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