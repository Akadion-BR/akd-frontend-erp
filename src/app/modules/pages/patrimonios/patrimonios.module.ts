import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';

import { ViewComponent } from './view/view.component';
import { SharedModule } from '../../shared/shared.module';
import { NewComponent } from './new/new.component';
import { DetailsComponent } from './details/details.component';



@NgModule({
  declarations: [
    ViewComponent,
    NewComponent,
    DetailsComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule
  ]
})
export class PatrimoniosModule { }
