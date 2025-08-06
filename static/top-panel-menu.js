import mitt from './emitter.js';

const { createApp } = Vue;

export default Vue.createApp({

  mounted() {
    //lancement de la fonction de création du graph
    mitt.emitter.emit('parent', "AppVue TopPanel créée");
  },
    data() {
      return {
          // visibilité du menu de configuration
        menuConf : false,
        // onglets du menu de configuration
        menuConfState : true,
        menuConfNetwork : false,
        menuConfTheme : false,
        // objet contenant l'état du système
        health : {},
        // liste des interfaces
        interfaces : [],
        // interface sélectionné
        interface : "",
        address_family : {},
        listInterfaceIP : [],
        interfaceData : {},
        // JSON d'IP à processer
        jsonIP : undefined,
        // liste des thèmes
        themes : [
          'darkgreen',
          'whiteblue',
          'whitedebug',
        ],
        themeSelected : 'darkgreen',
      }
    },
    methods: {
        // fonctions d'ajout d'information dans l'objet d'état de la plateforme
        addOrUpdateHealtValue : function(valuekey) {
            this.health[valuekey[0]] = valuekey[1];
            this.$forceUpdate();
        },
        // fonction de mise à jour de list d'interface
        updateInterfaces : function(interfacedata) {
          this.interfaces = interfacedata;
        },
        // fonction de mise à jour de liste de famille d'adresse
        updateAddrFamily : function(addressfamilydata) {
          this.address_family = addressfamilydata;
        },
        // fonction de récupération des "canaux" dispo sur une interface
        getInterfaceData : function() {
          console.log("fonction get interface data appelé");
          if(this.interface == null) {
            return; // on évite de requêter une absence d'interface.
          };

          axios({
            method : 'GET',
            url : '/json/interface/' + this.interface,
          })
          .then((response) => {
            // si la requête passe :
            this.interfaceData = response.data;
            let listInterfaceIPreturn = response.data[this.address_family['IPv4']]
            if(listInterfaceIPreturn != undefined) {
              this.listInterfaceIP = listInterfaceIPreturn;
            }else {
              this.listInterfaceIP = [];
            }
          })
          .catch(function (error) {
            // si la requête échoue :
            console.log(error);
            mitt.emitter.emit('notification_error', "API interface : " + error);
          });
        },
        // fonction de traitement du JSON d'une interface en IP/CIDR
        jsonInterfaceToIPCIDR : function() {
          if(this.jsonIP == undefined) { return };
         
          axios({
            method : 'POST',
            url : '/json/ipcidr',
            headers: {'Content-Type': 'application/json'},
            data: {'ip' : this.jsonIP.addr, "cidr" : this.jsonIP.netmask},
          }).then((response) => {
            mitt.emitter.emit('leftpanelmenu_cible', response.data.ipcidr);
          }).catch((error => {
            mitt.emitter.emit('notification_error', "API interfacetoipcidr : " + error);
            console.log(error);
          }))
        },
        // fonction de changement de thème
        changeTheme : function(themeName) {
          document.documentElement.setAttribute('data-theme', themeName);
          localStorage.setItem('theme', themeName);
          // on envoie au graph l'indication d'un rechargement de style nécessaire
          mitt.emitter.emit('reloadStyle', {'theme' : themeName});
        },
        // fonction de reset du panel : 
        resetPanel : function() {
          this.menuConf = false;
        }
    },
})