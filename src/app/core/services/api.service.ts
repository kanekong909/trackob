import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('og_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.base}${path}`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.base}${path}`, body, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.base}${path}`, body, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${path}`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  postForm<T>(path: string, formData: FormData): Observable<T> {
    const token = localStorage.getItem('og_token');
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    return this.http.post<T>(`${this.base}${path}`, formData, { headers })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    const msg = error?.error?.error || error?.message || 'Error del servidor';
    return throwError(() => new Error(msg));
  }

  putForm<T>(path: string, formData: FormData): Observable<T> {
    const token = localStorage.getItem('og_token');
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    return this.http.put<T>(`${this.base}${path}`, formData, { headers })
      .pipe(catchError(this.handleError));
  }
}
