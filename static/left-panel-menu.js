import mitt from './emitter.js';

const { createApp } = Vue;

export default Vue.createApp({

  mounted() {
    //lancement de la fonction de création du graph
    mitt.emitter.emit('parent', "AppVue LeftPanel créée");
  },
    data() {
      return {
        // ici on ajoute les variables manipulables du graph
        showMenu1 : false,
        showMenu2 : false,
        showMenu3 : false,
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
      }
    },
    methods: {
    // fonctions de mise à jour de VLAN cible
    addOrUpdateCible : function(cible) {
      this.cible = cible.id;
    },
    // fonctions de mise à jour de machine cible
    addOrUpdateMachineCible : function(machineCible) {
      this.machineCible = machineCible.id.split('\n')[0]; // on est obligés de split car on a fait en sorte que l'id contienne l'IP et l'adresse mac
    },
    // fonctions de scan local
    clickScanARP : function() {
      console.log("emit arp scan request");
      mitt.emitter.emit('scan_local', {type : 'request_arp_scan', cible : this.cible});
    },
    clickFastPing : function() {
      console.log("emit fast ping request");
      mitt.emitter.emit('scan_local', {type : 'request_fast_ping', cible : this.cible});
    },
    clickScanDHCP : function() {
      console.log("emit dhcp cidr scan request");
      mitt.emitter.emit('scan_local', {type : 'request_dhcp_cidr_scan', cible : this.cible});
    },
    clickScanCIDRTraceroute : function() {
      console.log("emit trace cidr scan request");
      mitt.emitter.emit('scan_local', {type : 'request_traceroute_cidr_scan', cible : this.cible});
    },
    // fonction de scan machines
    clickScanMachine : function(typescan) {
      console.log("emit scan machine " + typescan);
      mitt.emitter.emit('scan_machine', {type : typescan, cible : this.machineCible});
    },
    // fonctions de scan de placement étendue (global)
    clickTracerouteLocal : function() {
      console.log("emit local traceroute scan request");
      mitt.emitter.emit('scan_general', {type : 'request_traceroute_local_scan'});
    },
    clickTracerouteGlobal : function() {
      console.log("emit global traceroute scan request");
      mitt.emitter.emit('scan_general', {type : 'request_traceroute_global_scan'});
    },
    clickResolveAS : function() {
      console.log("emit global traceroute scan request");
      mitt.emitter.emit('scan_general', {type : 'request_resolve_as_scan'});
    },
  },
})