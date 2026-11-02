(function(){ "use strict";
const records={
  case:{variant:"case_mid_tower",source:"procedural",asset:null,unit:"mm"},
  gpu:{variants:["gpu_dual_fan","gpu_triple_fan"],source:"glb-reference",asset:"assets/models/gpu.glb",model:"GeForce RTX 3080 reference",license:"CC BY 4.0",unit:"mm"},
  motherboard:{variants:["motherboard_atx","motherboard_matx","motherboard_itx"],source:"glb-reference",asset:"assets/models/motherboard.glb",model:"ASUS Strix B550-F reference",license:"CC BY 4.0",unit:"mm"},
  cpu:{variant:"cpu_standard",source:"glb-reference",asset:"assets/models/cpu.glb",model:"generic desktop CPU reference",license:"CC BY 4.0",unit:"mm"},
  ram:{variants:["ram_standard","ram_rgb"],source:"glb-reference",asset:"assets/models/ram.glb",model:"Corsair Vengeance RGB Pro reference",license:"CC BY 4.0",unit:"mm"},
  cooler:{variants:["cooler_air","cooler_aio"],source:"glb-reference",asset:"assets/models/cooler.glb",model:"liquid CPU cooler reference",license:"CC BY 4.0",unit:"mm"},
  psu:{variant:"psu_standard",source:"glb-reference",asset:"assets/models/psu.glb",model:"PSU reference",license:"CC BY 4.0",unit:"mm"},
  storage:{variants:["ssd_m2","ssd_25"],source:"glb-reference",asset:"assets/models/storage.glb",model:"Samsung 990 Pro M.2 reference",license:"CC BY 4.0",unit:"mm"},
  fan:{variant:"fan_standard",source:"procedural",asset:null,unit:"mm"}
};
window.RigCraftModelRegistry=Object.freeze({get:k=>records[k]||null,list:()=>Object.keys(records)});
})();