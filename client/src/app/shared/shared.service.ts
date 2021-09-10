import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  triggerOpenModal = new Subject<{
    type: string,
    data: any,
  }>();

  public openModal(type: string, data?: any) {
    this.triggerOpenModal.next({
      type,
      data,
    });
  }
}
