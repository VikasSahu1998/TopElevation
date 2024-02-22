import { Component, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { ApiService } from '../Server/api.service';
import { Note } from '../model';
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
  lng!: any;
  updatedDistance!: number;
  TopElevationForm!: FormGroup | any;
  checkbox = "form accepted";

  generatedOTP!: any;
  otpSent: boolean = false;

  @ViewChild('mapElement') mapElement!: ElementRef;

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
    imageData: undefined
  }
  ngOnInit(): void {
    this.TopElevationForm = this.formbuilder.group({
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

      } else {
        // OTP verification failed
        alert("OTP verification failed");
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
    if (this.TopElevationForm.valid) {
      this.api.postData(this.noteObj)
        .subscribe({
          next: (res) => {
            // console.log('PUT request successful', res);
            alert('data send successful',);
            this.TopElevationForm.reset();
          },
          error: () => {
            // console.error('PUT request failed',);
            alert('PUT request failed',);
          }
        })
    }
    else {
      alert("Fill the Form Completely");
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
        console.error('Error capturing screenshot:', error);
      });
    } else {
      console.error('mapElement is undefined');
    }
  }
  

  showMap(lat: number, lng: number) {
    const map = L.map('map').setView([19.794444, 85.751111], 10);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    L.control.scale().addTo(map);

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
          onEachFeature: (feature, layer) => {

            layer.on('click', (e) => {
              // const { lat, lng } = e.latlng;
              const marker = L.marker([lat, lng]).addTo(map);
              const marker2 = L.marker([19.794444, 85.751111]).addTo(map);
              const line = L.polyline([[lat, lng], [19.794444, 85.751111]], { color: 'blue' }).addTo(map);

              map.on('click', (e) => {
                const { lat, lng } = e.latlng;
                this.latitude = lat;
                this.longitude = lng;
                marker.setLatLng([lat, lng]);

                line.setLatLngs([[lat, lng], [19.794444, 85.751111]]);

                this.TopElevationForm.get('Latitude').setValue(lat);
                this.TopElevationForm.get('Longitude').setValue(lng);
                this.updatedDistance = this.calculateDistance(lat, lng, 19.794444, 85.751111);

                const popup = L.popup({ autoPan: false, offset: L.point(0, -30) }).setLatLng(e.latlng);
                popup.setContent(`Permissible Elevation: ${feature.properties.Name}<br> Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)},<br> Distance: ${this.updatedDistance.toFixed(2)} Km`);
                popup.openOn(map);
              });
            });
          }
        });
        geojsonLayer.addTo(map);
      });
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