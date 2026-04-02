import { Alert } from 'react-native';

export const exportToJSON = async (data: any, filename: string) => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    console.log(`[Export] JSON data for ${filename}:`, jsonString);
    Alert.alert('Sucesso', 'Dados exportados com sucesso (verifique os logs).');
  } catch (error) {
    console.error('Erro ao exportar JSON:', error);
    Alert.alert('Erro', 'Não foi possível exportar os dados em JSON.');
  }
};

export const exportToCSV = async (data: any[], filename: string) => {
  try {
    if (data.length === 0) {
      Alert.alert('Aviso', 'Não há dados para exportar.');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(val => `"${val}"`).join(',')
    ).join('\n');
    
    const csvString = `${headers}\n${rows}`;
    console.log(`[Export] CSV data for ${filename}:`, csvString);
    Alert.alert('Sucesso', 'Dados exportados com sucesso (verifique os logs).');
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    Alert.alert('Erro', 'Não foi possível exportar os dados em CSV.');
  }
};
