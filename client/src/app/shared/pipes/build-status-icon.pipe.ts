import { Pipe, PipeTransform } from '@angular/core';
// import { Build } from '@aitheon/build-server';

@Pipe({
  name: 'buildStatusIcon'
})
export class BuildStatusIconPipe implements PipeTransform {

  transform(value: string, args?: any): any {
    switch (value) {
      case 'SUCCESS':
        return 'fa-check-circle';
      case 'ERROR':
        return 'fa-exclamation-triangle';
      case 'PENDING':
        return 'fa-clock-o';
      case 'IN_PROGRESS':
        return 'fa-cog fa-spin';
      case 'CANCELED':
        return 'fa-times';
    }
    return '';
  }

}
