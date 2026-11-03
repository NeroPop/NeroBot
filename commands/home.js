// commands/home.js
//
// The /home command. Shows a random picture of North Wales.
// To add a picture, add its web address as a new line to the list below.

const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, Colors } = require('discord.js');
const { pickRandom } = require('../lib/random');

// The web addresses of the pictures. The last ones are Jack's own photos.
const pictureUrls = [
  'https://www.tripsavvy.com/thmb/j6otqJqDgBzC_VOUnNx6x8bTwnk=/2120x1414/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-4540860191-59930af8396e5a0010a21cde.jpg',
  'https://a.cdn-hotels.com/gdcs/production73/d1961/c3614f55-0384-4856-b9ec-c27f8eb4965a.jpg?impolicy=fcrop&w=800&h=533&q=medium',
  'https://www.visitwales.com/sites/visit/files/styles/o_articleimagegroup__landscape__2_1x/public/media-library/2021-01/NVW-C155-1819-0008-small.jpg?h=e5aec6c8&itok=v4-9r41c',
  'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/10/3c/72/25/photo1jpg.jpg?w=1200&h=500&s=1',
  'https://a.cdn-hotels.com/gdcs/production50/d630/12896021-5c7f-4bad-8cd2-8bcd2c14b283.jpg',
  'https://nt.global.ssl.fastly.net/binaries/content/gallery/website/national/regions/wales/places/carneddau-and-glyderau/library/winter/walking-cwm-idwal-snowdonia-wales-1474991.jpg?auto=webp&width=1200&crop=16:9',
  'https://upload.wikimedia.org/wikipedia/commons/6/60/Llyn_Llydaw_from_Crib_Goch_2.jpg',
  'https://snowdonia.gov.wales/wp-content/uploads/2022/01/shutterstock_16304320.jpg',
  'https://upload.travelawaits.com/ta/uploads/2021/04/15934239943753829477f896d14df159342-800x800.jpg',
  'https://files.holidaycottages.co.uk/blogs%2F1653389110412-snowdonia%28resize%29.jpg',
  'https://wildbounds.com/cdn/shop/articles/neil-mark-thomas-EMKdemBiWSA-unsplash_1600x.jpg?v=1670954077',
  'https://www.biodiversitywales.org.uk/Image/744/en-GB/0',
  'https://www.snowdonia-society.org.uk/wp-content/uploads/2020/11/cynllun-eryri-image-1-919x400.jpg',
  'https://www.northwalesholidaycottages.co.uk/CropUp/597x354/media/53702/dolwyddenlan-castle-and-surrounding-hills.jpg?quality=90',
  'https://cdn.budgetyourtrip.com/images/photos/headerphotos/large/unitedkingdom_mountsnowdon.jpg',
  'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/17/02/cc/d8/we-offer-castle-trips.jpg?w=1200&h=-1&s=1',
  'https://www.visitwales.com/sites/visit/files/styles/o_herodestinationregion_fullwidth_1x/public/media-library/2020-07/NCX-SC01-1516-0523.jpg?h=0cc72446&itok=PFIhSRfZ',
  'https://www.visitsnowdonia.info/sites/default/files/styles/home_hero_carousel_1400x600_/public/Bwlch%20Llanberis%20Pass%20%C2%A9%20Crown%20copyright%20%282016%29%20Visit%20Wales%20%201400%20600%20N131-091-D-A6W.jpg?itok=yq2xzNt1',
  'https://snowdonia.gov.wales/wp-content/uploads/2022/08/JHM-SNP-HIGH-RES-CWM-IDWAL-005_comp.jpg',
  'https://live.staticflickr.com/65535/50120247977_bf983c909a_b.jpg',
  'https://live.staticflickr.com/65535/50400965588_c42c2d9cba_b.jpg',
  'https://i0.wp.com/www.mountain-walks.co.uk/wp-content/uploads/2018/08/Devils-Kitchen-and-Llyn-Idwal.jpg?fit=1000%2C664&ssl=1',
  'https://www.earthlight-images.com/wp-content/uploads/2021/12/2112a-170-HDR-2.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/5/5d/Glyder_Fawr_rocks.JPG',
  'https://loveswimrun.co.uk/wp-content/uploads/2019/12/menaistraits.jpg',
  'https://s0.geograph.org.uk/geophotos/05/72/51/5725134_e5530a72.jpg',
  'https://1.bp.blogspot.com/-KSOkBukNHvE/YNHYPplHV4I/AAAAAAAAVT4/31YPuIxNU-0pCygytvRnjwrgymaNMvDMwCLcBGAsYHQ/s800/Aber%2BFalls%2B%2528Rhaeadr%2BFawr%2529%2Bin%2BSnowdonia.jpg',
  'https://www.dioni.co.uk/wp-content/uploads/2021/02/NVW-C91-1011-1116-1200x800.jpg',
  'https://i.imgur.com/UTXHu8W.jpg',
  'https://i.imgur.com/5WxWBuq.jpg',
  'https://i.imgur.com/gI9xPoc.jpg',
  'https://i.imgur.com/Ol0Vsv0.jpg',
  'https://i.imgur.com/CTKilCK.jpg',
  'https://i.imgur.com/OEmdogn.jpg',
  'https://i.imgur.com/j1bY3RH.jpg',
  'https://i.imgur.com/83VRueA.jpg',
  'https://i.imgur.com/pUk07ra.jpg',
  'https://i.imgur.com/jj95Sax.jpg',
  'https://i.imgur.com/R5j6ayD.jpg',
  'https://i.imgur.com/TVWiDJZ.jpg',
  'https://i.imgur.com/9HTRCDE.jpg',
  'https://i.imgur.com/4yKc0TI.jpg',
  'https://i.imgur.com/qtcnCXH.jpg',
  'https://i.imgur.com/T3fCMRq.jpg',
  'https://i.imgur.com/PjqMnjK.jpg',
  'https://i.imgur.com/OGYwLpM.jpg',
  'https://i.imgur.com/M6j8dfV.jpg',
  'https://i.imgur.com/TPOFmeD.jpg',
  'https://i.imgur.com/plKLNyR.jpg',
  'https://i.imgur.com/4TF1h0k.jpg',
  'https://i.imgur.com/Lb2NkkA.jpg',
  'https://i.imgur.com/5gSNCkc.jpg',
  'https://i.imgur.com/EILjzvh.jpg',
  'https://i.imgur.com/Z4nI6Nq.jpg',
  'https://i.imgur.com/CE671ym.jpg',
  'https://i.imgur.com/7TD6QZd.jpg',
  'https://i.imgur.com/Qz6OoOy.jpg',
  'https://i.imgur.com/T9Ls3uK.png',
  'https://i.imgur.com/9jWwfQ7.jpg',
  'https://i.imgur.com/CEaYE0N.jpg',
  'https://i.imgur.com/rzXjROT.jpg',
  'https://i.imgur.com/nfuu6An.jpg',
  'https://i.imgur.com/kh4zCPj.jpg',
  'https://i.imgur.com/wfpcobz.jpg',
  'https://i.imgur.com/tChA3A4.jpg',
  'https://i.imgur.com/4H9FHdq.jpg',
  'https://i.imgur.com/eODbLwk.jpg',
  'https://i.imgur.com/J3WtMfR.jpg',
  'https://i.imgur.com/v0BeJ0X.jpg',
  'https://i.imgur.com/89YNu2w.jpg',
  'https://i.imgur.com/nMWpdY9.jpg',
  'https://i.imgur.com/3oomIJC.jpg',
  'https://i.imgur.com/wgkyizI.jpg',
  'https://i.imgur.com/tJGoPAK.jpg',
  'https://i.imgur.com/oY39RfX.jpg',
  'https://i.imgur.com/bcquFdC.jpg',
  'https://i.imgur.com/vZItplR.jpg',
  'https://i.imgur.com/G41DQdE.jpg',
  'https://i.imgur.com/wbepZ7q.jpg',
  'https://i.imgur.com/UrC3O7c.jpg',
  'https://i.imgur.com/TxmmHYO.jpg',
  'https://i.imgur.com/37wbVZN.jpg',
  'https://i.imgur.com/u0LD1b0.jpg',
  'https://i.imgur.com/PbtjDS9.jpg',
  'https://i.imgur.com/Hm1S9kz.jpg',
  'https://i.imgur.com/ww021bF.jpg',
  'https://i.imgur.com/uRggxfa.jpg',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('home') // must match the file name (home.js)
    .setDescription('Shows a random picture of North Wales.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    // Check there are pictures in the list.
    if (pictureUrls.length === 0) {
      await interaction.reply('No images available.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle('🏞️ Random Picture of Home')
      .setImage(pickRandom(pictureUrls))
      .setFooter({ text: 'Enjoy the view of North Wales!' });

    await interaction.reply({ embeds: [embed] });
  },
};
