import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Note } from '../model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {


  baseURL: string = "https://od3ru829y7.execute-api.us-west-2.amazonaws.com/items";

  constructor(private http: HttpClient) { }


  postData(data: any) {
    // const headers = {
    //   'Content-Type': 'application/json',
    //   'Access-Control-Allow-Origin': 'http://localhost:4200',
    //   'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
    //   'Access-Control-Allow-Headers': '*',
    //   'Access-Control-Allow-Credentials': 'true'
    // };
    return this.http.post<any>(this.baseURL, JSON.stringify(data));
  }
  // , { headers, withCredentials: true }
}
