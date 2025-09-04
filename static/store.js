import { defineStore } from './js/pinia.esm-browser.js'

export const useStore = defineStore('storeName', {
  // arrow function recommended for full type inference
  state: () => {
    return {
      // all these properties will have their type inferred automatically
      
      // objet contenant l'état du système
      health : {},
      // liste des interfaces
      interfaces : [],
      // interface sélectionné
      interface : "",
      address_family : {},
      listInterfaceIP : [],
      interfaceData : {},
      listInterfaceIP : [],
      // JSON d'IP à processer
      jsonIP : {},
      // thème selectionné
      themeSelected : 'darkgreen',
      // IP/CIDR de VLAN de base
      cible : "192.168.1.0/24",
      // IP de machine cible
      machineCible : "",
      // affichage de la range de port
      portShow : false,
      portStart : "0",
      portEnd : "400",
      // gestion des cibles
      nodesSelected : [],
      // variable d'info sur machine
      nodedata : {},
      // variable d'info sur service
      servicedata : {},
      // objets vides pour intialiser l'accès aux applications depuis le store
      EchoSounderApp : {},
      topPanelMenuApp : {},
      leftPanelMenuApp : {},
      rightPanelMenuApp : {},
      notificationPanelMenuApp : {},
      graphNetworkApp : {},
    }
  },
});