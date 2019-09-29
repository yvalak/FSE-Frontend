import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap, retry } from 'rxjs/operators';
import { User } from '../shared/model/user';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { environment } from 'src/environments/environment';

const backendURL = `${environment.backend_service_url}`;
const httpOptions = {
  headers : new HttpHeaders({'Content-Type': 'application/json'}),
  responseType: 'text' as 'json' 
}; 

@Injectable({
  providedIn: 'root'
})
export class TaskManagerService {

  constructor(private http :HttpClient) { }

  form: FormGroup = new FormGroup({
    userId: new FormControl(null),
    firstName: new FormControl('',Validators.required),
    lastName: new FormControl('',Validators.required),
    employeeId: new FormControl('',[Validators.required,Validators.pattern('^[A-Z0-9]*$')]),

  });

initilizeFormGroup(){
  this.form.setValue({
    userId: 0,
    firstName: '',
    lastName: '',
    employeeId: '',
  })
}
populateForm(user) {
  this.form.setValue(user);
}
 addUser(user):Observable<User>{
  console.log("adding New User:"+user.userId+user.firstName+user.lastName+user.employeeId);
  return this.http.post<User>(backendURL+'createUser', JSON.stringify(user),httpOptions).pipe(
    tap(res=>{console.log('Add Response'+res)}),
    retry(1),
    catchError(this.handleError<User>('Add User'))
  )
}

 updateUser(user :User): Observable<User>{
  return this.http.put<User>(backendURL+'updateUser',user,httpOptions).pipe(
    tap((user)=> {console.log(`updated User W/ id=${user.userId}`)}),
    catchError(this.handleError<any>('update User'))
  )
}
  getUsers(): Observable<User[]>{
    console.log("service calling getusers")
    return this.http.get<User[]>(backendURL+'getUsers').pipe(
      tap(res => console.log("searched User results")),
      retry(1),
      catchError(this.handleError<User[]>('search Users',[]))
    )
  }

  deleteUser(id):Observable<User>{
    return this.http.delete(backendURL+'deleteUser/'+id).pipe(
      retry(1),
      catchError(this.handleError<any>('Delete User'))
    )
  }
  
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
  
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead
  
      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);
  
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
