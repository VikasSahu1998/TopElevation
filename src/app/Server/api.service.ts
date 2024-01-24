import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {


  constructor(private http: HttpClient) { }

  postData(data: any) {
    return this.http.post<any>("https://top-elevation-form-default-rtdb.firebaseio.com/TopElevationForm.json/", data);
  }

}
