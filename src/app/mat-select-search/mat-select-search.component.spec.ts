import { Component } from '@angular/core';



interface Bank {
  id: string;
  name: string;
}

@Component({
  selector: 'mat-select-search-test',
  template: `
    <mat-form-field>
      <mat-select [formControl]="bankCtrl">
        <mat-select-search [formControl]="bankFilterCtrl"></mat-select-search>
        <mat-option *ngFor="let bank of filteredBanks | async" [value]="bank.id">
          {{bank.name}}
        </mat-option>
      </mat-select>
    </mat-form-field>
  `,
})
export class MatSelectSearchTestComponent {
}

