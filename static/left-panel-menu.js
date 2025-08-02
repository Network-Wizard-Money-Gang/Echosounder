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
        // IP/CIDR de cible de base
        cible : "192.168.1.0/24",
        // affichage de la range de port
        portShow : false,
        portStart : "0",
        portEnd : "400",
      }
    },
    methods: {
    // fonctions de mise à jour de la cible
    addOrUpdateCible : function(cible) {
      this.cible = cible;
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
  },
})