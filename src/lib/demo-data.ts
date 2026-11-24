import type { Review } from "@/types/review";

export const properties = [
  "Potts Point", "Central Sydney", "Darling Harbour", "Olympic Hotel Paddington"
];

export const demoReviews: Review[] = [
  { id:"d1", property:"Potts Point", guest_name:"Alex M.", review_date:"2026-10-04", rating:9.2, title:"Excellent location", review_text:"Lovely stay. The team was welcoming and the location made exploring easy.", sentiment:"Positive", category:"Location", source:"Demo", is_demo:true },
  { id:"d2", property:"Potts Point", guest_name:"Jamie R.", review_date:"2026-10-12", rating:6.1, title:"Room needed attention", review_text:"Great area, but the bathroom could have been cleaner and the towels were not replaced.", sentiment:"Negative", category:"Cleanliness", source:"Demo", is_demo:true },
  { id:"d3", property:"Potts Point", guest_name:"Taylor P.", review_date:"2026-10-21", rating:8.4, title:"Friendly staff", review_text:"Helpful staff and a comfortable bed. Some street noise at night.", sentiment:"Positive", category:"Staff", source:"Demo", is_demo:true },
  { id:"d4", property:"Central Sydney", guest_name:"Morgan L.", review_date:"2026-10-03", rating:8.8, title:"Convenient base", review_text:"Close to transport and restaurants. Check-in was quick and easy.", sentiment:"Positive", category:"Location", source:"Demo", is_demo:true },
  { id:"d5", property:"Central Sydney", guest_name:"Casey W.", review_date:"2026-10-15", rating:5.8, title:"Slow check-in", review_text:"We waited a long time to check in and the room was not ready at the promised time.", sentiment:"Negative", category:"Service", source:"Demo", is_demo:true },
  { id:"d6", property:"Central Sydney", guest_name:"Jordan K.", review_date:"2026-10-25", rating:7.2, title:"Good overall", review_text:"Comfortable stay, although breakfast options were limited.", sentiment:"Neutral", category:"Food", source:"Demo", is_demo:true },
  { id:"d7", property:"Darling Harbour", guest_name:"Sam D.", review_date:"2026-10-02", rating:9.5, title:"Wonderful weekend", review_text:"Fantastic harbour area, spotless room and attentive staff.", sentiment:"Positive", category:"Cleanliness", source:"Demo", is_demo:true },
  { id:"d8", property:"Darling Harbour", guest_name:"Riley B.", review_date:"2026-10-17", rating:6.4, title:"Noise at night", review_text:"The view was lovely but noise from outside made it difficult to sleep.", sentiment:"Negative", category:"Noise", source:"Demo", is_demo:true },
  { id:"d9", property:"Darling Harbour", guest_name:"Avery C.", review_date:"2026-10-28", rating:8.1, title:"Would return", review_text:"Good value and a helpful reception team. Wi-Fi dropped a couple of times.", sentiment:"Positive", category:"Facilities", source:"Demo", is_demo:true },
  { id:"d10", property:"Olympic Hotel Paddington", guest_name:"Drew F.", review_date:"2026-10-06", rating:8.7, title:"Great neighbourhood", review_text:"Quiet neighbourhood, friendly team and clean room.", sentiment:"Positive", category:"Location", source:"Demo", is_demo:true },
  { id:"d11", property:"Olympic Hotel Paddington", guest_name:"Cameron N.", review_date:"2026-10-19", rating:5.9, title:"Maintenance issue", review_text:"The shower temperature kept changing and maintenance took a while to respond.", sentiment:"Negative", category:"Maintenance", source:"Demo", is_demo:true },
  { id:"d12", property:"Olympic Hotel Paddington", guest_name:"Robin S.", review_date:"2026-10-29", rating:7.6, title:"Pleasant stay", review_text:"Nice staff and comfortable room. A few more breakfast choices would be appreciated.", sentiment:"Neutral", category:"Food", source:"Demo", is_demo:true }
];
