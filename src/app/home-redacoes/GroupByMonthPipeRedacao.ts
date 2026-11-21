import { Pipe, PipeTransform } from '@angular/core';
import { Redacao } from '../models/redacao';

export interface GroupedRedacoes {
  monthYearLabel: string; 
  key: string;           
  redacoes: Redacao[];    
}

@Pipe({
  name: 'groupByMonthRedacao',
  pure: true 
})
export class GroupByMonthPipeRedacao implements PipeTransform {
  private readonly monthNames = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  transform(redacoes: Redacao[]): GroupedRedacoes[] {
    if (!redacoes || redacoes.length === 0) {
      return [];
    }

    const groupedObj: { [key: string]: any[] } = {};

    redacoes.forEach(redacao => {
      const date = new Date(redacao.data);
      const year = date.getFullYear();
      const month = date.getMonth(); 
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!groupedObj[key]) {
        groupedObj[key] = [];
      }
      groupedObj[key].push(redacao);
    });

    const result: GroupedRedacoes[] = Object.keys(groupedObj).map(key => {
      const [year, monthStr] = key.split('-');
      const monthIndex = parseInt(monthStr, 10) - 1;
      const monthYearLabel = `${this.monthNames[monthIndex]} ${year}`;

      return {
        monthYearLabel,
        key,
        redacoes: groupedObj[key]
      };
    });

    return result.sort((a, b) => b.key.localeCompare(a.key));
  }
}