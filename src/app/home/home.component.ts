import { Component, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { ApiService } from '../Server/api.service';
import { GeoJsonObject } from 'geojson';
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


  generateOTP() {
    // Generate a random 4-digit OTP
    this.generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
    // You can implement OTP sending logic here, like sending an SMS to the entered phone number
    alert(`Generated OTP: ${this.generatedOTP}`);
    // console.log("Generated OTP: ", this.generatedOTP);
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
  onsubmit() {
    this.captureScreenshot()
    console.log(this.TopElevationForm.value)

    const enteredOTP = this.TopElevationForm.get('otp').value;

    if (enteredOTP === this.generatedOTP) {
      console.log("OTP Verified Successfully!");
      // You can proceed with further actions after successful OTP verification
    } else {
      console.log("Incorrect OTP!");
      // Handle incorrect OTP entered by the user
    }
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

  showMap(lat: number, long: number) {
    const map = L.map('map').setView([19.794444, 85.751111], 10);
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
        { "type": "Feature", "properties": { "Height": "RW_05_23" }, "geometry": { "type": "Polygon", "coordinates": [[[85.755575, 19.7901841], [85.7552965, 19.7904935], [85.7289946, 19.7692846], [85.7292731, 19.7689751], [85.755575, 19.7901841]]] } },
        { "type": "Feature", "properties": { "Height": "NOC_Req" }, "geometry": { "type": "Polygon", "coordinates": [[[85.6680768, 19.7520038], [85.7015922, 19.7147728], [85.8165183, 19.8074363], [85.7830076, 19.8446889], [85.6680768, 19.7520038]]] } },
        { "type": "Feature", "properties": { "Height": "24.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.7095858, 19.7058894], [85.8245107, 19.7985477], [85.8165183, 19.8074363], [85.7015922, 19.7147728], [85.7095858, 19.7058894]]] } },
        { "type": "Feature", "properties": { "Height": "24.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.7750105, 19.8535752], [85.6600786, 19.760885], [85.6680768, 19.7520038], [85.7830076, 19.8446889], [85.7750105, 19.8535752]]] } },
        { "type": "Feature", "properties": { "Height": "59.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.830696, 19.791668], [85.7157719, 19.6990136], [85.7226219, 19.6913991], [85.837545, 19.7840491], [85.830696, 19.791668]]] } },
        { "type": "Feature", "properties": { "Height": "49.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.7157719, 19.6990136], [85.830696, 19.791668], [85.8245107, 19.7985477], [85.7095858, 19.7058894], [85.7157719, 19.6990136]]] } },
        { "type": "Feature", "properties": { "Height": "59.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.6538876, 19.7677586], [85.7688204, 19.8604528], [85.7619648, 19.8680686], [85.6470311, 19.77537], [85.6538876, 19.7677586]]] } },
        { "type": "Feature", "properties": { "Height": "49.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.6538876, 19.7677586], [85.6600786, 19.760885], [85.7750105, 19.8535752], [85.7688204, 19.8604528], [85.6538876, 19.7677586]]] } },
        { "type": "Feature", "properties": { "Height": "74.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.7226219, 19.6913991], [85.7095858, 19.7058894], [85.6445574, 19.6533826], [85.6575945, 19.638897], [85.7226219, 19.6913991]]] } },
        { "type": "Feature", "properties": { "Height": "64.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.7015922, 19.7147728], [85.6365633, 19.6622631], [85.6445574, 19.6533826], [85.7095858, 19.7058894], [85.7015922, 19.7147728]]] } },
        { "type": "Feature", "properties": { "Height": "64.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.8245107, 19.7985477], [85.8896579, 19.8509946], [85.8816662, 19.859886], [85.8165183, 19.8074363], [85.8245107, 19.7985477]]] } },
        { "type": "Feature", "properties": { "Height": "74.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.5950466, 19.7083602], [85.6600786, 19.760885], [85.6470311, 19.77537], [85.5819981, 19.7228405], [85.5950466, 19.7083602]]] } },
        { "type": "Feature", "properties": { "Height": "74.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.7750105, 19.8535752], [85.8401619, 19.9060401], [85.8271172, 19.9205383], [85.7619648, 19.8680686], [85.7750105, 19.8535752]]] } },
        { "type": "Feature", "properties": { "Height": "64.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.6680768, 19.7520038], [85.6600786, 19.760885], [85.5950466, 19.7083602], [85.6030453, 19.6994819], [85.6680768, 19.7520038]]] } },
        { "type": "Feature", "properties": { "Height": "64.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.7830076, 19.8446889], [85.8481583, 19.8971508], [85.8401619, 19.9060401], [85.7750105, 19.8535752], [85.7830076, 19.8446889]]] } },
        { "type": "Feature", "properties": { "Height": "49.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.7830076, 19.8446889], [85.8165183, 19.8074363], [85.8816662, 19.859886], [85.8481583, 19.8971508], [85.7830076, 19.8446889]]] } },
        { "type": "Feature", "properties": { "Height": "49.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.6030453, 19.6994819], [85.6365633, 19.6622631], [85.7015922, 19.7147728], [85.6680768, 19.7520038], [85.6030453, 19.6994819]]] } },
        { "type": "Feature", "properties": { "Height": "74.7M AMSL" }, "geometry": { "type": "Polygon", "coordinates": [[[85.9468755, 19.7728675], [85.9468755, 19.7728675], [85.9468169, 19.7746714], [85.9467392, 19.7764748], [85.9466425, 19.7782773], [85.9465268, 19.7800788], [85.9463921, 19.7818791], [85.9462384, 19.7836781], [85.9460658, 19.7854755], [85.9458741, 19.7872712], [85.9456635, 19.789065], [85.945434, 19.7908567], [85.9451856, 19.7926461], [85.9449183, 19.7944331], [85.9446321, 19.7962175], [85.9443271, 19.7979991], [85.9440034, 19.7997777], [85.9436608, 19.8015532], [85.9432996, 19.8033253], [85.9429196, 19.805094], [85.942521, 19.8068589], [85.9421038, 19.80862], [85.941668, 19.8103771], [85.9412136, 19.8121299], [85.9407408, 19.8138784], [85.9402495, 19.8156223], [85.9397398, 19.8173615], [85.9392118, 19.8190957], [85.9386655, 19.8208249], [85.938101, 19.8225489], [85.9375183, 19.8242674], [85.9369174, 19.8259803], [85.9362985, 19.8276874], [85.9356616, 19.8293886], [85.9350067, 19.8310837], [85.934334, 19.8327725], [85.9336435, 19.8344549], [85.9329352, 19.8361307], [85.9322093, 19.8377996], [85.9314657, 19.8394616], [85.9307046, 19.8411165], [85.9299261, 19.8427642], [85.9291302, 19.8444044], [85.9283171, 19.8460369], [85.9274867, 19.8476617], [85.9266391, 19.8492786], [85.9257746, 19.8508874], [85.9248931, 19.8524879], [85.9239947, 19.85408], [85.9230795, 19.8556635], [85.9221476, 19.8572383], [85.9211991, 19.8588042], [85.9202342, 19.860361], [85.9192528, 19.8619086], [85.9182551, 19.8634469], [85.9172412, 19.8649757], [85.9162112, 19.8664948], [85.9151652, 19.8680041], [85.9141032, 19.8695034], [85.9130255, 19.8709926], [85.9119321, 19.8724715], [85.9108231, 19.87394], [85.9096987, 19.875398], [85.9085588, 19.8768452], [85.9074038, 19.8782816], [85.9062336, 19.879707], [85.9050484, 19.8811213], [85.9038483, 19.8825243], [85.9026334, 19.8839158], [85.9014038, 19.8852958], [85.9001598, 19.8866641], [85.8989013, 19.8880206], [85.8976285, 19.8893651], [85.8963416, 19.8906975], [85.8950407, 19.8920177], [85.8937258, 19.8933255], [85.8923972, 19.8946207], [85.891055, 19.8959034], [85.8896992, 19.8971733], [85.8883301, 19.8984303], [85.8869478, 19.8996743], [85.8855524, 19.9009052], [85.884144, 19.9021228], [85.8827228, 19.903327], [85.881289, 19.9045178], [85.8798426, 19.9056949], [85.8783839, 19.9068583], [85.8769129, 19.9080078], [85.8754298, 19.9091433], [85.8739348, 19.9102648], [85.872428, 19.9113721], [85.8709095, 19.9124651], [85.8693796, 19.9135436], [85.8678383, 19.9146076], [85.8662859, 19.9156571], [85.8647224, 19.9166917], [85.863148, 19.9177116], [85.861563, 19.9187164], [85.8599674, 19.9197063], [85.8583614, 19.920681], [85.8567451, 19.9216405], [85.8551188, 19.9225846], [85.8534826, 19.9235133], [85.8518366, 19.9244265], [85.8501811, 19.9253241], [85.8485161, 19.926206], [85.8468419, 19.9270721], [85.8451586, 19.9279223], [85.8434664, 19.9287566], [85.8417655, 19.9295748], [85.8400559, 19.9303769], [85.838338, 19.9311628], [85.8366119, 19.9319324], [85.8348776, 19.9326856], [85.8331355, 19.9334224], [85.8313857, 19.9341427], [85.8296284, 19.9348464], [85.8278637, 19.9355334], [85.8260918, 19.9362037], [85.8243129, 19.9368572], [85.8225271, 19.9374939], [85.8207348, 19.9381137], [85.8189359, 19.9387165], [85.8171308, 19.9393022], [85.8153195, 19.9398708], [85.8135024, 19.9404223], [85.8116794, 19.9409566], [85.809851, 19.9414736], [85.8080171, 19.9419732], [85.806178, 19.9424556], [85.804334, 19.9429205], [85.8024851, 19.9433679], [85.8006315, 19.9437978], [85.7987735, 19.9442102], [85.7969112, 19.944605], [85.7950449, 19.9449822], [85.7931746, 19.9453417], [85.7913007, 19.9456834], [85.7894232, 19.9460075], [85.7875423, 19.9463138], [85.7856584, 19.9466022], [85.7837714, 19.9468729], [85.7818817, 19.9471257], [85.7799894, 19.9473606], [85.7780948, 19.9475776], [85.7761979, 19.9477767], [85.774299, 19.9479578], [85.7723983, 19.9481209], [85.7704959, 19.9482661], [85.7685922, 19.9483933], [85.7666871, 19.9485025], [85.764781, 19.9485936], [85.7628741, 19.9486667], [85.7609664, 19.9487218], [85.7590583, 19.9487589], [85.7571499, 19.9487779], [85.7552414, 19.9487788], [85.7533329, 19.9487617], [85.7514248, 19.9487266], [85.7495171, 19.9486734], [85.7476101, 19.9486022], [85.7457039, 19.9485129], [85.7437987, 19.9484057], [85.7418948, 19.9482804], [85.7399924, 19.9481371], [85.7380915, 19.9479758], [85.7361924, 19.9477966], [85.7342953, 19.9475994], [85.7324005, 19.9473843], [85.7305079, 19.9471513], [85.728618, 19.9469004], [85.7267308, 19.9466316], [85.7248465, 19.946345], [85.7229654, 19.9460406], [85.7210876, 19.9457185], [85.7192133, 19.9453786], [85.7173427, 19.945021], [85.715476, 19.9446457], [85.7136133, 19.9442528], [85.7117549, 19.9438422], [85.7099009, 19.9434142], [85.7080516, 19.9429686], [85.706207, 19.9425056], [85.7043675, 19.9420251], [85.7025331, 19.9415273], [85.7007042, 19.9410121], [85.6988807, 19.9404797], [85.697063, 19.9399301], [85.6952512, 19.9393633], [85.6934455, 19.9387794], [85.691646, 19.9381784], [85.689853, 19.9375605], [85.6880667, 19.9369256], [85.6862871, 19.9362739], [85.6845146, 19.9356054], [85.6827492, 19.9349202], [85.6809911, 19.9342183], [85.6792406, 19.9334998], [85.6774977, 19.9327648], [85.6757628, 19.9320134], [85.6740358, 19.9312456], [85.6723171, 19.9304615], [85.6706068, 19.9296611], [85.668905, 19.9288447], [85.667212, 19.9280122], [85.6655278, 19.9271637], [85.6638527, 19.9262994], [85.6621869, 19.9254192], [85.6605304, 19.9245234], [85.6588835, 19.9236119], [85.6572463, 19.9226849], [85.6556191, 19.9217425], [85.6540019, 19.9207847], [85.6523949, 19.9198117], [85.6507982, 19.9188235], [85.6492122, 19.9178203], [85.6476368, 19.9168022], [85.6460722, 19.9157692], [85.6445187, 19.9147214], [85.6429763, 19.9136591], [85.6414453, 19.9125821], [85.6399257, 19.9114908], [85.6384178, 19.9103852], [85.6369216, 19.9092653], [85.6354373, 19.9081314], [85.6339651, 19.9069834], [85.6325052, 19.9058217], [85.6310576, 19.9046461], [85.6296225, 19.903457], [85.6282, 19.9022543], [85.6267904, 19.9010382], [85.6253937, 19.8998089], [85.62401, 19.8985664], [85.6226396, 19.897311], [85.6212825, 19.8960426], [85.6199389, 19.8947614], [85.6186089, 19.8934676], [85.6172927, 19.8921613], [85.6159904, 19.8908426], [85.614702, 19.8895117], [85.6134278, 19.8881686], [85.6121679, 19.8868136], [85.6109224, 19.8854467], [85.6096913, 19.8840681], [85.608475, 19.882678], [85.6072733, 19.8812764], [85.6060866, 19.8798635], [85.6049149, 19.8784395], [85.6037582, 19.8770044], [85.6026168, 19.8755585], [85.6014908, 19.8741019], [85.6003802, 19.8726347], [85.5992852, 19.871157], [85.5982058, 19.8696691], [85.5971423, 19.8681711], [85.5960946, 19.8666631], [85.5950629, 19.8651452], [85.5940473, 19.8636177], [85.5930479, 19.8620806], [85.5920648, 19.8605342], [85.5910981, 19.8589786], [85.5901479, 19.8574138], [85.5892143, 19.8558402], [85.5882973, 19.8542579], [85.5873971, 19.8526669], [85.5865138, 19.8510675], [85.5856474, 19.8494598], [85.5847981, 19.8478441], [85.5839659, 19.8462203], [85.5831508, 19.8445888], [85.5823531, 19.8429497], [85.5815727, 19.8413031], [85.5808098, 19.8396492], [85.5800643, 19.8379882], [85.5793365, 19.8363202], [85.5786263, 19.8346454], [85.5779338, 19.832964], [85.5772591, 19.8312761], [85.5766023, 19.8295819], [85.5759634, 19.8278816], [85.5753425, 19.8261753], [85.5747397, 19.8244633], [85.574155, 19.8227456], [85.5735884, 19.8210225], [85.5730401, 19.8192941], [85.57251, 19.8175606], [85.5719983, 19.8158222], [85.571505, 19.8140791], [85.5710301, 19.8123313], [85.5705737, 19.8105792], [85.5701358, 19.8088228], [85.5697165, 19.8070624], [85.5693158, 19.8052981], [85.5689337, 19.8035301], [85.5685703, 19.8017586], [85.5682256, 19.7999837], [85.5678997, 19.7982057], [85.5675926, 19.7964247], [85.5673043, 19.7946408], [85.5670348, 19.7928543], [85.5667843, 19.7910654], [85.5665526, 19.7892742], [85.5663398, 19.7874809], [85.5661459, 19.7856856], [85.5659711, 19.7838886], [85.5658152, 19.7820901], [85.5656782, 19.7802901], [85.5655603, 19.778489], [85.5654614, 19.7766868], [85.5653815, 19.7748838], [85.5653207, 19.7730801], [85.5652789, 19.7712759], [85.5652561, 19.7694715], [85.5652524, 19.7676669], [85.5652677, 19.7658623], [85.565302, 19.764058], [85.5653554, 19.7622541], [85.5654278, 19.7604508], [85.5655192, 19.7586483], [85.5656296, 19.7568467], [85.5657591, 19.7550463], [85.5659075, 19.7532471], [85.5660749, 19.7514495], [85.5662612, 19.7496535], [85.5664665, 19.7478594], [85.5666906, 19.7460674], [85.5669337, 19.7442775], [85.5671957, 19.74249], [85.5674764, 19.7407051], [85.567776, 19.7389229], [85.5680944, 19.7371436], [85.5684315, 19.7353675], [85.5687873, 19.7335946], [85.5691618, 19.7318252], [85.5695549, 19.7300594], [85.5699666, 19.7282974], [85.5703969, 19.7265394], [85.5708457, 19.7247855], [85.571313, 19.723036], [85.5717986, 19.7212909], [85.5723027, 19.7195506], [85.5728251, 19.7178151], [85.5733657, 19.7160846], [85.5739246, 19.7143594], [85.5745016, 19.7126395], [85.5750967, 19.7109251], [85.5757098, 19.7092165], [85.576341, 19.7075137], [85.57699, 19.705817], [85.5776569, 19.7041265], [85.5783416, 19.7024424], [85.5790439, 19.7007648], [85.579764, 19.699094], [85.5805016, 19.6974301], [85.5812566, 19.6957732], [85.5820292, 19.6941236], [85.582819, 19.6924813], [85.5836261, 19.6908466], [85.5844504, 19.6892196], [85.5852918, 19.6876005], [85.5861502, 19.6859894], [85.5870256, 19.6843865], [85.5879178, 19.6827919], [85.5888267, 19.6812059], [85.5897523, 19.6796286], [85.5906945, 19.67806], [85.5916531, 19.6765005], [85.5926282, 19.6749501], [85.5936195, 19.673409], [85.594627, 19.6718774], [85.5956505, 19.6703553], [85.5966901, 19.668843], [85.5977455, 19.6673406], [85.5988167, 19.6658483], [85.5999036, 19.6643662], [85.601006, 19.6628944], [85.6021238, 19.6614331], [85.603257, 19.6599825], [85.6044054, 19.6585426], [85.6055689, 19.6571137], [85.6067474, 19.6556958], [85.6079408, 19.6542892], [85.6091489, 19.6528939], [85.6103716, 19.6515101], [85.6116089, 19.650138], [85.6128605, 19.6487776], [85.6141264, 19.6474291], [85.6154065, 19.6460926], [85.6167005, 19.6447683], [85.6180084, 19.6434564], [85.6193301, 19.6421568], [85.6206653, 19.6408698], [85.6220141, 19.6395955], [85.6233762, 19.638334], [85.6247515, 19.6370855], [85.6261399, 19.63585], [85.6275412, 19.6346277], [85.6289553, 19.6334188], [85.6303821, 19.6322232], [85.6318214, 19.6310412], [85.633273, 19.6298729], [85.6347369, 19.6287184], [85.6362129, 19.6275777], [85.6377008, 19.6264511], [85.6392004, 19.6253386], [85.6407117, 19.6242403], [85.6422345, 19.6231564], [85.6437686, 19.6220869], [85.6453139, 19.621032], [85.6468702, 19.6199918], [85.6484374, 19.6189663], [85.6500153, 19.6179557], [85.6516037, 19.6169601], [85.6532026, 19.6159795], [85.6548117, 19.6150141], [85.6564308, 19.614064], [85.6580599, 19.6131292], [85.6596988, 19.6122099], [85.6613472, 19.6113061], [85.663005, 19.6104179], [85.6646722, 19.6095455], [85.6663484, 19.6086889], [85.6680335, 19.6078481], [85.6697274, 19.6070234], [85.6714299, 19.6062147], [85.6731408, 19.6054221], [85.67486, 19.6046458], [85.6765872, 19.6038858], [85.6783224, 19.6031421], [85.6800653, 19.6024149], [85.6818158, 19.6017041], [85.6835736, 19.60101], [85.6853387, 19.6003326], [85.6871108, 19.5996718], [85.6888898, 19.5990279], [85.6906754, 19.5984008], [85.6924676, 19.5977906], [85.6942661, 19.5971974], [85.6960707, 19.5966212], [85.6978813, 19.5960622], [85.6996977, 19.5955202], [85.7015198, 19.5949955], [85.7033472, 19.594488], [85.7051799, 19.5939979], [85.7070177, 19.5935251], [85.7088603, 19.5930697], [85.7107076, 19.5926317], [85.7125595, 19.5922113], [85.7144157, 19.5918083], [85.716276, 19.591423], [85.7181403, 19.5910552], [85.7200084, 19.5907051], [85.72188, 19.5903727], [85.7237551, 19.590058], [85.7256334, 19.5897611], [85.7275147, 19.5894819], [85.7293989, 19.5892205], [85.7312857, 19.588977], [85.7331749, 19.5887513], [85.7350665, 19.5885435], [85.7369602, 19.5883536], [85.7388557, 19.5881816], [85.740753, 19.5880275], [85.7426518, 19.5878914], [85.7445519, 19.5877733], [85.7464532, 19.5876731], [85.7483555, 19.5875909], [85.7502585, 19.5875267], [85.7521621, 19.5874805], [85.7540661, 19.5874523], [85.7559703, 19.5874421], [85.7578745, 19.58745], [85.7597785, 19.5874758], [85.7616822, 19.5875196], [85.7635853, 19.5875815], [85.7654877, 19.5876613], [85.7673891, 19.5877591], [85.7692894, 19.5878749], [85.7711884, 19.5880087], [85.7730859, 19.5881604], [85.7749818, 19.58833], [85.7768757, 19.5885176], [85.7787676, 19.5887231], [85.7806572, 19.5889464], [85.7825444, 19.5891876], [85.7844289, 19.5894466], [85.7863107, 19.5897235], [85.7881894, 19.5900181], [85.7900649, 19.5903305], [85.7919371, 19.5906606], [85.7938057, 19.5910084], [85.7956705, 19.5913739], [85.7975314, 19.5917569], [85.7993882, 19.5921576], [85.8012407, 19.5925758], [85.8030887, 19.5930114], [85.804932, 19.5934646], [85.8067705, 19.5939351], [85.8086039, 19.594423], [85.8104321, 19.5949283], [85.812255, 19.5954507], [85.8140722, 19.5959904], [85.8158836, 19.5965473], [85.8176891, 19.5971213], [85.8194885, 19.5977123], [85.8212816, 19.5983203], [85.8230682, 19.5989452], [85.8248481, 19.599587], [85.8266212, 19.6002456], [85.8283873, 19.6009209], [85.8301462, 19.6016129], [85.8318977, 19.6023215], [85.8336417, 19.6030466], [85.835378, 19.6037882], [85.8371063, 19.6045461], [85.8388267, 19.6053204], [85.8405388, 19.6061109], [85.8422425, 19.6069176], [85.8439376, 19.6077403], [85.845624, 19.608579], [85.8473015, 19.6094336], [85.8489699, 19.6103041], [85.850629, 19.6111902], [85.8522788, 19.6120921], [85.853919, 19.6130095], [85.8555494, 19.6139423], [85.85717, 19.6148905], [85.8587805, 19.615854], [85.8603808, 19.6168327], [85.8619707, 19.6178265], [85.8635501, 19.6188352], [85.8651188, 19.6198589], [85.8666766, 19.6208973], [85.8682235, 19.6219504], [85.8697591, 19.6230181], [85.8712835, 19.6241002], [85.8727964, 19.6251967], [85.8742977, 19.6263075], [85.8757872, 19.6274324], [85.8772648, 19.6285714], [85.8787304, 19.6297242], [85.8801837, 19.6308909], [85.8816247, 19.6320712], [85.8830532, 19.6332652], [85.8844691, 19.6344725], [85.8858722, 19.6356932], [85.8872623, 19.6369271], [85.8886394, 19.6381741], [85.8900033, 19.6394341], [85.8913539, 19.6407069], [85.8926911, 19.6419924], [85.8940146, 19.6432904], [85.8953244, 19.644601], [85.8966203, 19.6459238], [85.8979022, 19.6472589], [85.8991701, 19.648606], [85.9004236, 19.649965], [85.9016628, 19.6513358], [85.9028875, 19.6527183], [85.9040976, 19.6541123], [85.905293, 19.6555176], [85.9064735, 19.6569342], [85.907639, 19.6583619], [85.9087895, 19.6598005], [85.9099247, 19.66125], [85.9110446, 19.6627101], [85.9121491, 19.6641807], [85.913238, 19.6656617], [85.9143113, 19.6671529], [85.9153688, 19.6686542], [85.9164104, 19.6701654], [85.9174361, 19.6716864], [85.9184457, 19.673217], [85.9194392, 19.6747571], [85.9204164, 19.6763065], [85.9213772, 19.6778651], [85.9223215, 19.6794327], [85.9232493, 19.6810091], [85.9241604, 19.6825943], [85.9250548, 19.6841879], [85.9259323, 19.68579], [85.9267929, 19.6874003], [85.9276365, 19.6890186], [85.9284631, 19.6906448], [85.9292724, 19.6922788], [85.9300645, 19.6939203], [85.9308392, 19.6955693], [85.9315966, 19.6972254], [85.9323364, 19.6988887], [85.9330587, 19.7005589], [85.9337633, 19.7022358], [85.9344503, 19.7039193], [85.9351194, 19.7056093], [85.9357707, 19.7073054], [85.9364041, 19.7090077], [85.9370195, 19.7107158], [85.9376169, 19.7124297], [85.9381962, 19.7141491], [85.9387574, 19.715874], [85.9393003, 19.717604], [85.939825, 19.7193391], [85.9403313, 19.7210791], [85.9408193, 19.7228238], [85.9412889, 19.724573], [85.9417399, 19.7263266], [85.9421725, 19.7280843], [85.9425866, 19.7298461], [85.942982, 19.7316116], [85.9433588, 19.7333809], [85.9437169, 19.7351535], [85.9440563, 19.7369295], [85.9443769, 19.7387087], [85.9446788, 19.7404907], [85.9449619, 19.7422756], [85.9452261, 19.744063], [85.9454715, 19.7458528], [85.945698, 19.7476448], [85.9459055, 19.749439], [85.9460941, 19.7512349], [85.9462638, 19.7530326], [85.9464145, 19.7548318], [85.9465462, 19.7566323], [85.9466589, 19.758434], [85.9467526, 19.7602367], [85.9468273, 19.7620401], [85.9468829, 19.7638442], [85.9469195, 19.7656487], [85.9469371, 19.7674534], [85.9469356, 19.7692583], [85.9469151, 19.771063], [85.9468755, 19.7728675]]] } },

      ],
      "type": "FeatureCollection"
    } as GeoJsonObject;


    const geojsonLayer = new L.GeoJSON(geojsonData, {
      style: function (feature) {
        if (!feature || !feature.properties || !feature.properties.Height) return {};
            const height = feature.properties.Height;
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
        layer.bindPopup(feature.properties.Height);
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