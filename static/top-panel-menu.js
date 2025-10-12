import mitt from './emitter.js';
import {useStore} from './store.js';


export default Vue.createApp({

  mounted() {
    //lancement de la fonction de création du graph
    mitt.emitter.emit('parent', "AppVue TopPanel créée");
  },
  data() {
    let store = useStore();
    return {
      // visibilité du menu de configuration
      menuConf : false,
      // onglets du menu de configuration
      menuConfState : true,
      menuConfNetwork : false,
      menuConfTheme : false,
      // objet contenant l'état du système
      health : store.health,
      // liste des interfaces
      interfaces : store.interfaces,
      // interface sélectionné
      interface : store.interface,
      address_family : store.address_family,
      listInterfaceIP : store.listInterfaceIP,
      interfaceData : store.interfaceData,
      // JSON d'IP à processer
      jsonIP : store.jsonIP,
      // liste des thèmes
      themes : [
        'darkgreen',
        'whiteblue',
        'whitedebug',
      ],
      themeSelected : store.themeSelected,
      // accès interne à l'objet store contenant tout les contextes partagés
      store : store,
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
        if(this.interface == null) {
          return; // on évite de requêter une absence d'interface.
        };

        axios({
          method : 'GET',
          url : '/json/interface/' + this.store.interface,
        })
        .then((response) => {
          // si la requête passe :
          this.store.interfaceData = response.data;
          //this.interfaceData = response.data;
          let listInterfaceIPreturn = response.data[this.store.address_family['IPv4']]
          // on utilise pas le store parce que la réactivité sur les listes est fuckup
          if(listInterfaceIPreturn != undefined) {
            this.listInterfaceIP = listInterfaceIPreturn;
          }else {
            this.listInterfaceIP  = [];
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
        if(this.store.jsonIP == undefined) { return };
        axios({
          method : 'POST',
          url : '/json/ipcidr',
          headers: {'Content-Type': 'application/json'},
          data: {'ip' : this.store.jsonIP.addr, "cidr" : this.store.jsonIP.netmask},
        }).then((response) => {
          this.store.$patch({cible : response.data.ipcidr});
        }).catch((error => {
          mitt.emitter.emit('notification_error', "API interfacetoipcidr : " + error);
          console.log(error);
        }))
      },
      // fonction de changement de thème
      changeTheme : function(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('theme', themeName);
        // on met à jour le thème
        this.theme = themeName;
        // on envoie au graph l'indication d'un rechargement de style nécessaire
        this.store.graphNetworkApp.loadStyle();
      },
      // fonction de reset du panel : 
      resetPanel : function() {
        this.menuConf = false;
      }
  },

});