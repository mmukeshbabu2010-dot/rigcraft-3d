(function(){
  "use strict";
  const categoryKeys={cases:"case",motherboards:"motherboard",cpus:"cpu",gpus:"gpu",psus:"psu",ram:"ram",coolers:"cooler",storage:"storage",fans:"fan"};
  const categoryAssets={
    case:{variant:"case_mid_tower",source:"procedural",asset:null,unit:"mm"},
    gpu:{variants:["gpu_dual_fan","gpu_triple_fan"],source:"glb-reference",asset:"assets/models/gpu.glb",model:"GeForce RTX 3080 reference",compatibleProductIds:["rtx3080"],license:"CC BY 4.0",unit:"mm"},
    motherboard:{variants:["motherboard_atx","motherboard_matx","motherboard_itx"],source:"glb-reference",asset:"assets/models/motherboard.glb",model:"ASUS Strix B550-F reference",license:"CC BY 4.0",unit:"mm"},
    cpu:{variant:"cpu_standard",source:"glb-reference",asset:"assets/models/cpu.glb",model:"generic desktop CPU reference",license:"CC BY 4.0",unit:"mm"},
    ram:{variants:["ram_standard","ram_rgb"],source:"glb-reference",asset:"assets/models/ram.glb",model:"Corsair Vengeance RGB Pro reference",license:"CC BY 4.0",unit:"mm"},
    cooler:{variants:["cooler_air","cooler_aio"],source:"glb-reference",asset:"assets/models/cooler.glb",model:"liquid CPU cooler reference",license:"CC BY 4.0",unit:"mm"},
    psu:{variant:"psu_standard",source:"glb-reference",asset:"assets/models/psu.glb",model:"PSU reference",license:"CC BY 4.0",unit:"mm"},
    storage:{variants:["ssd_m2","ssd_25"],source:"glb-reference",asset:"assets/models/storage.glb",model:"Samsung 990 Pro M.2 reference",license:"CC BY 4.0",unit:"mm"},
    fan:{variant:"fan_standard",source:"procedural",asset:null,unit:"mm"}
  };
  const profiles={
    "corsair-5000d":{shape:"airflow-mid-tower"},
    "compact-itx":{shape:"compact-itx-chassis"},
    "mid-tower":{shape:"generic-airflow-tower"},
    "z790-atx":{shape:"atx-z790-board"},
    "b760-matx":{shape:"matx-b760-board"},
    "x670-atx":{shape:"atx-x670-board"},
    "b650-itx":{shape:"mini-itx-b650-board"},
    "i9-14900k":{shape:"lga1700-processor-package"},
    "i7-14700k":{shape:"lga1700-processor-package"},
    "ryzen9-7950x":{shape:"am5-processor-package"},
    "ryzen7-7800x3d":{shape:"am5-processor-package"},
    "rtx4090":{shape:"triple-fan-graphics-card"},
    "rtx4070":{shape:"dual-fan-graphics-card"},
    "rx7900xtx":{shape:"triple-fan-graphics-card"},
    "rtx4070-super":{shape:"dual-or-triple-fan-graphics-card"},
    "rx7800xt":{shape:"triple-fan-graphics-card"},
    "psu-850w":{shape:"atx-psu"},"psu-650w":{shape:"atx-psu"},"psu-1000w":{shape:"atx-psu"},"psu-750w":{shape:"atx-psu"},
    "ddr5-32gb-6000":{shape:"ddr5-dimm-kit",modules:2},"ddr5-64gb-6000":{shape:"ddr5-dimm-kit",modules:2},"ddr5-16gb-5200":{shape:"ddr5-dimm-kit",modules:2},
    "tower-air-120":{shape:"dual-tower-air-cooler"},"aio-240":{shape:"240mm-aio"},"aio-360":{shape:"360mm-aio"},
    "nvme-1tb":{shape:"m2-2280-nvme"},"nvme-2tb":{shape:"m2-2280-nvme"},"sata-2tb":{shape:"2-5-inch-sata-drive"},
    "fan-120-argb":{shape:"120mm-argb-fan-pack"},"fan-140-black":{shape:"140mm-black-fan-pack"}
  };
  function resolve(category,part){
    if(!part||!part.id||!categoryKeys[category])return null;
    const profile=profiles[part.id]||{shape:categoryKeys[category]+"-catalogue-form"};
    return Object.freeze({id:part.id,category,kind:"sku-linked-procedural-preview",shape:profile.shape,profile:Object.freeze({...profile}),
      fidelity:"SKU-linked procedural preview · illustrative",exactManufacturerModel:false,asset:null,unit:"mm",
      note:"This procedural preview is linked to the selected catalogue record but is not the manufacturer's actual geometry or official CAD model. Unverified dimensions are not inferred."});
  }
  window.RigCraftModelRegistry=Object.freeze({resolve,get:k=>categoryAssets[k]||null,list:()=>Object.keys(categoryKeys),profileCount:Object.keys(profiles).length});
})();
