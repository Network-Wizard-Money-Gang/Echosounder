import mitt from './emitter.js';
import {useStore} from './store.js';

export default Vue.createApp({

  mounted() {
    //lancement de la fonction de création du graph
    mitt.emitter.emit('parent', "AppVue LeftPanel créée");
  },
  data() {
    let store = useStore();
    return {
      // ici on ajoute les variables manipulables du graph
      showMenu1 : false,
      showMenu2 : false,
      showMenu3 : false,
      // IP/CIDR de VLAN de base
      cible : store.cible,
      // IP de machine cible
      machineCible : store.machineCible,
      // affichage de la range de port
      portShow : false,
      portStart : "0",
      portEnd : "400",
      // gestion des cibles
      nodesSelected : [],
      // accès interne à l'objet store contenant tout les contextes partagés
      store : store,
    }
  },
  methods: {
    // fonctions de mise à jour de VLAN cible
    addOrUpdateCible : function(cible) {
      this.store.cible = cible.id;
    },
    // fonctions de mise à jour de machine cible
    addOrUpdateMachineCible : function(machineCible) {
      this.store.machineCible = machineCible.id.split('\n')[0]; // on est obligés de split car on a fait en sorte que l'id contienne l'IP et l'adresse mac
    },
    // fonctions de scan local
    clickScanARP : function() {
      console.log("emit arp scan request");
      this.store.graphNetworkApp.receiveEmitRequestLocalScan({type : 'request_arp_scan', cible : this.store.cible});
    },
    clickFastPing : function() {
      console.log("emit fast ping request");
      this.store.graphNetworkApp.receiveEmitRequestLocalScan({type : 'request_fast_ping', cible : this.store.cible});
    },
    clickScanDHCP : function() {
      console.log("emit dhcp cidr scan request");
      this.store.graphNetworkApp.receiveEmitRequestLocalScan({type : 'request_dhcp_cidr_scan', cible : this.store.cible});
    },
    clickScanCIDRTraceroute : function() {
      console.log("emit trace cidr scan request");
      this.store.graphNetworkApp.receiveEmitRequestLocalScan({type : 'request_traceroute_cidr_scan', cible : this.store.cible});
    },
    // fonction de scan machines
    clickScanMachine : function(typescan) {
      console.log("emit scan machine " + typescan);
      if(this.store.nodesSelected.length > 1) {
        this.store.graphNetworkApp.receiveEmitRequestMachineScan({type : typescan, cible : this.store.nodesSelected});
      }else {
        this.store.graphNetworkApp.receiveEmitRequestMachineScan({type : typescan, cible : this.store.machineCible});
      }
    },
    //// fonction de scan par ranges de port
    // fonction d'affichage de range de port et de scan de port spécifiques
    clickScanServices : function() {
      if (this.portShow){
        console.log("emit services scan request");
        if(this.store.nodesSelected.length > 1) {
          this.store.graphNetworkApp.receiveEmitRequestMachinePortScan({type : 'request_services_scan', cible : this.store.nodesSelected, port_start : this.portStart, port_end : this.portEnd});
        }else {
          this.store.graphNetworkApp.receiveEmitRequestMachinePortScan({type : 'request_services_scan', cible : this.store.machineCible, port_start : this.portStart, port_end : this.portEnd});
        }
      }else{
        this.portShow = true;
      }
    },
    // fonction de scan rapide de port
    clickScanFastServices : function() {
      console.log("emit services fast scan request");
      if(this.store.nodesSelected.length > 1) {
        this.store.graphNetworkApp.receiveEmitRequestMachinePortScan({type : 'request_services_fast_scan', cible : this.store.nodesSelected});
      }else {
        this.store.graphNetworkApp.receiveEmitRequestMachinePortScan({type : 'request_services_fast_scan', cible : this.store.machineCible});
      }
    },
    // fonction de récupération de liste d'IP à scanner à partir du graph : 
    getSelectionScan : function() {
      console.log("emit get selected");
      this.store.graphNetworkApp.actionGraph('get_selected');
    },
    setIPListScan : function(list_ip) {
      console.log(list_ip);
      this.store.nodesSelected = list_ip;
    },
    deleteIPSelected : function(selectedIP) {
      let index = this.store.nodesSelected.indexOf(selectedIP);
      if(index != -1) {
        this.store.nodesSelected.splice(index, 1);
      }
    },
    deleteAllIPSelected : function() {
      this.store.nodesSelected = [];
    },
    // fonctions de scan de placement étendue (global)
    clickTracerouteLocal : function() {
      console.log("emit local traceroute scan request");
      this.store.graphNetworkApp.receiveEmitRequestGeneralScan({type : 'request_traceroute_local_scan'});
    },
    clickTracerouteGlobal : function() {
      console.log("emit global traceroute scan request");
      this.store.graphNetworkApp.receiveEmitRequestGeneralScan({type : 'request_traceroute_global_scan'});
    },
    clickResolveAS : function() {
      console.log("emit global traceroute scan request");
      this.store.graphNetworkApp.receiveEmitRequestGeneralScan({type : 'request_resolve_as_scan'});
    },
    // fonction de reset du panel : 
    resetPanel : function() {
      this.showMenu1 = false;
      this.showMenu2 = false;
      this.showMenu3 = false;
    }
  },

})