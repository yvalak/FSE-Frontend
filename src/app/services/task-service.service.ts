import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl, Validators, FormGroupDirective, NgForm } from '@angular/forms';
import { AppCustomValidator } from '../validators/app-custom-validator';
import { Project } from '../shared/model/project';
import { Observable, of } from 'rxjs';
import { tap, retry, catchError } from 'rxjs/operators';
import { ErrorStateMatcher } from '@angular/material';
import { Task } from '../shared/model/task';
import { ParentTask } from '../shared/model/parent-task';
import { DatePipe } from '@angular/common';
import { environment } from 'src/environments/environment';

export /** Error when the parent is invalid */
class CrossFieldErrorMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    //return control.dirty && form.invalid;
    return control.touched && form.hasError('invalidDates');
  }
}

const backendURL = `${environment.backend_service_url}`;
const httpOptions = {
  headers : new HttpHeaders({'Content-Type': 'application/json'}),
  responseType: 'text' as 'json' 
}; 


@Injectable({
  providedIn: 'root'
})
export class TaskServiceService {

  form : FormGroup;
  errorMatcher = new CrossFieldErrorMatcher();
  endDate: Date;  

  constructor(private fb:FormBuilder,private http: HttpClient,private datePipe : DatePipe) {  
    this.endDate = new Date();
    this.endDate.setDate(new Date().getDate()+1);  
    this.form = this.fb.group({
      taskId: new FormControl(null),
      parentId: new FormControl(null),
      projectId: new FormControl(null),
      userId: new FormControl(null),
      projectName: new FormControl('',AppCustomValidator.required),
      taskName: new FormControl('',AppCustomValidator.required),
      chkPTask: new FormControl(false),
      startDate: new FormControl( new Date(),AppCustomValidator.fromDateValidator),
      endDate: new FormControl(this.endDate,AppCustomValidator.toDateValidator),
      priority: new FormControl(0),
      parentTaskName: new FormControl('',AppCustomValidator.required),      
      userName: new FormControl(null,AppCustomValidator.required)      
      },{validator: AppCustomValidator.identityRevealedValidator});
  } 

  initilizeFormGroup(){
    this.form.setValue({
      taskId: 0,
      parentId: 0,
      projectId:0,
      userId: 0,
      projectName: '',
      taskName: '',
      chkPTask: false,
      startDate: new Date(),
      endDate: this.endDate,
      priority:0,
      parentTaskName: '',
      userName:'',
    })
  }
  populateForm(task) {
  console.log("papulating form:"+JSON.stringify(task));
    this.form.setValue({
      taskId: task.taskId,
      parentId: task.parentTask.parentId,
      projectId:task.project.projectId,
      userId: task.user.userId,
      projectName: task.project.projectName,
      taskName: task.taskName,
      chkPTask: false,
      startDate: new Date(task.startDate),
      endDate: new Date(task.endDate),
      priority: task.priority,
      parentTaskName: task.parentTask.parentTaskName,
      userName:task.user.firstName+" "+task.user.lastName,
    });
    this.form.controls['chkPTask'].disable();  
  }
  addTask(task,parentId,projectId,userId):Observable<Task>{
    console.log("adding New Task:"+JSON.stringify(task));
    return this.http.post<Task>(backendURL+'createTask?parentId='+parentId+'&projectId='+projectId+'&userId='+userId, JSON.stringify(task),httpOptions).pipe(
      tap(res=>{console.log('Add Response'+res)}),
      retry(1),
      catchError(this.handleError<Task>('Add Task'))
    )
  }
  updateTask(task :Task,parentId,projectId,userId): Observable<Task>{
    return this.http.put<Task>(backendURL+'updateTask?parentId='+parentId+'&projectId='+projectId+'&userId='+userId,task,httpOptions).pipe(
      tap((user)=> {console.log(`updated Task W/ id=${task.taskId}`)}),
      catchError(this.handleError<any>('update Task'))
    )
  }
  getTask(taskId): Observable<Task>{
    console.log("service calling getTask")
    return this.http.get<Task>(backendURL+'getTaskById?taskId='+taskId).pipe(
      tap(res => console.log("searched Tasks result")),
      catchError(this.handleError<Task>('get Task'))
    )
  }
    getTasks(): Observable<Task[]>{
      console.log("service calling getTasks")
      return this.http.get<Task[]>(backendURL+'getTasks').pipe(
        tap(_ => console.log("searched Tasks results")),
        catchError(this.handleError<Task[]>('search Task',[]))
      )
    }
    getTasksByProjectId(projectId): Observable<Task[]>{
      console.log("service calling getTasks")
      return this.http.get<Task[]>(backendURL+'getTasksByPorjectId?projectId='+projectId).pipe(
        tap(_ => console.log("searched Tasks results")),
        catchError(this.handleError<Task[]>('search Task',[]))
      )
    }
    addParentTask(ptask :ParentTask): Observable<ParentTask>{
      return this.http.post<ParentTask>(backendURL+'createParentTask',ptask,httpOptions).pipe(
        tap((user)=> {console.log(`updated Task W/ id=${ptask.parentId}`)}),
        catchError(this.handleError<ParentTask>('create ParentTask'))
      )
    }
    updateParentTask(ptask :ParentTask): Observable<ParentTask>{
      return this.http.put<ParentTask>(backendURL+'updateParentTask',ptask,httpOptions).pipe(
        tap((user)=> {console.log(`updated Task W/ id=${ptask.parentId}`)}),
        catchError(this.handleError<any>('update ParentTask'))
      )
    }
    getParentTasks(): Observable<ParentTask[]>{
      console.log("service calling getParentTasks")
      return this.http.get<ParentTask[]>(backendURL+'getParentTasks').pipe(
        tap(_ => console.log("searched Parent Task results")),
        catchError(this.handleError<ParentTask[]>('search Parent Tasks',[]))
      )
    }

    deleteTask(id):Observable<Task>{
      return this.http.delete(backendURL+'deleteTask/'+id).pipe(
        retry(1),
        catchError(this.handleError<any>('Delete Task'))
      )
    }
    public hasError = (controlName: string, errorName: string) =>{
      return this.form.controls[controlName].hasError(errorName);
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
