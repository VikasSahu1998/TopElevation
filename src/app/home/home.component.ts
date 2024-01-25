import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { ApiService } from '../Server/api.service';
import { GeoJsonObject } from 'geojson';
import * as L from 'leaflet';


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
  ngOnInit(): void {
    this.TopElevationForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.nullValidator, Validators.minLength(3),]),
      email: new FormControl('', [Validators.required, Validators.nullValidator, Validators.email]),
      Address: new FormControl('', [Validators.required, Validators.nullValidator]),
      PhoneNumber: new FormControl('', [Validators.required, Validators.nullValidator, Validators.minLength(10), Validators.maxLength(10)]),
      Latitude: new FormControl('', [Validators.required, Validators.nullValidator]),
      Longitude: new FormControl('', [Validators.required, Validators.nullValidator]),
      checkbox: new FormControl('', [Validators.required, Validators.nullValidator]),
      uniqueId: new FormControl(['']),
      dateTime: new FormControl(['']),
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

  // mylatlng: any = {
  //   lat: undefined,
  //   lng: undefined
  // };
  // findMe() {
  //   if (navigator.geolocation) {
  //     navigator.geolocation.getCurrentPosition((position) => {
  //       console.log('latitude', position.coords.latitude);
  //       console.log('longitude', position.coords.longitude);
  //       this.mylatlng.lat = position.coords.latitude;
  //       this.mylatlng.lng = position.coords.longitude;
  //     });
  //   } else {
  //     alert("Geolocation is not supported by this browser.");
  //   }
  // }

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

  onsubmit() {
    console.log(this.TopElevationForm.value)
    if (this.TopElevationForm.valid) {

      this.api.postData(this.TopElevationForm.value)
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


  showMap(lat: number, long: number) {
    const map = L.map('map').setView([lat, long], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.cognitivenavigation.com/">Cognitive Navigation Pvt. Ltd </a>'
    }).addTo(map);

    const marker1 = L.marker([lat, long]).addTo(map);
    const marker2 = L.marker([19.794444, 85.751111]).addTo(map);

    // Initialize the line with the initial coordinates
    const line = L.polyline([[lat, long], [19.794444, 85.751111]], { color: 'blue' }).addTo(map);

    const distance = this.calculateDistance(lat, long, 19.794444, 85.751111);


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
      console.log('Distance:', this.updatedDistance, 'kilometers');

      // Display the clicked location details
      console.log('Clicked Location:', lat, lng);
      const popup = L.popup();
      popup.setContent(`Latitude: ${lat}, Longitude: ${long} Distance: ${this.updatedDistance} km `);

      popup.setLatLng(e.latlng).openOn(map);

    });



    const geojsonData: GeoJsonObject = {
      "features": [
        { "type": "Feature", "properties": { "id": 31, "TopElevation": "74.7 Mtr" }, "geometry": { "type": "Polygon", "coordinates": [[[85.5584595, 19.8662817], [85.5579825, 19.8496167], [85.5755949, 19.8491647], [85.5760738, 19.8658293], [85.5584595, 19.8662817]]] } },
        { "type": "Feature", "properties": { "id": 33, "TopElevation": "74.7 Mtr" }, "geometry": { "type": "Polygon", "coordinates": [[[85.557506, 19.8329517], [85.55703, 19.8162866], [85.5746387, 19.8158354], [85.5751166, 19.8325001], [85.557506, 19.8329517]]] } },
        { "type": "Feature", "properties": { "id": 39, "TopElevation": "74.7 Mtr" }, "geometry": { "type": "Polygon", "coordinates": [[[85.5546571, 19.7329606], [85.5541839, 19.7162953], [85.5717818, 19.7158466], [85.5722567, 19.7325115], [85.5546571, 19.7329606]]] } }
      ],
      "type": "FeatureCollection"
    } as GeoJsonObject;



    const geojsonLayer = new L.GeoJSON(geojsonData, {
      style: function (feature) {
        return { color: 'blue' };
      },
      onEachFeature: function (feature, layer) {
        layer.bindPopup(feature.properties.TopElevation);
      }
    });
    geojsonLayer.addTo(map);

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