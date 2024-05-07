
// function hi($) {
//     /*Sale statistics Chart*/
//     if ($('#myChart').length) {
//         var ctx = document.getElementById('myChart').getContext('2d');
//         var canvas = document.getElementById('myChart');
//         var select = document.getElementById('select');
//         console.log(select.value)
//         // Retrieving the data attribute
//         var dbDataString = canvas.getAttribute('data-db-data');
//         var dbData = JSON.parse(dbDataString);
//         const today =new Date();
//         const months =  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
//         let date=0;
//         let month = 0;
        
//         let slicedMonths =0;
//         let coundDelivered =0;
//         let coundReturn = 0;
//         let coundCanceled = 0;
//         let coundPending = 0;
//         const arrayDelivered = Array(12).fill(0);
//         const arrayreturn = Array(12).fill(0);
//         const arraycanceled = Array(12).fill(0);
//         const arraypending = Array(12).fill(0);
//         for (let i = 0; i < dbData.length; i++) {
//             for (let j = 0; j < dbData[i].products.length; j++) {
//                 const product = dbData[i].products[j];
//                 const orderMonth = new Date(product.orderDate).getMonth(); // Get the month index (zero-based)
//                 const status = product.productStatus; 

//                 // Update the count for the corresponding month and status
//                 switch (status) {
//                     case "Delivered":
//                         arrayDelivered[orderMonth]++;
//                         break;
//                     case "return":
//                         arrayreturn[orderMonth]++;
//                         break;
//                     case "canceled":
//                         arraycanceled[orderMonth]++;
//                         break;
//                     case "pending":
//                         arraypending[orderMonth]++;
//                         break;
//                     default:
//                         break;
//                 }
//             }
//         }
      
   
//         var chart = new Chart(ctx, {
//             // The type of chart we want to create
//             type: 'line',
           
//             // The data for our dataset
//             data: {
              
//                 labels:  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
//                 datasets: [{
//                         label: 'Delivered',
//                         tension: 0.3,
//                         fill: true,
//                         backgroundColor: 'rgba(44, 120, 220, 0.2)',
//                         borderColor: 'rgba(44, 120, 220)',
//                         data: arrayDelivered
//                     },
//                     {
//                         label: 'return',
//                         tension: 0.3,
//                         fill: true,
//                         backgroundColor: 'rgba(255, 0, 0, 0.2)',
//                         borderColor: 'rgb(255, 0, 0)',
//                         data: arrayreturn
//                     },
//                     {
//                         label: 'canceled',
//                         tension: 0.3,
//                         fill: true,
//                         backgroundColor: 'rgba(380, 200, 230, 0.2)',
//                         borderColor: 'rgb(380, 200, 230)',
//                         data:arraycanceled
//                     },
//                     {
//                         label: 'pending',
//                         tension: 0.3,
//                         fill: true,
//                         backgroundColor: 'rgba(4, 209, 130, 0.2)',
//                         borderColor: 'rgb(4, 209, 130)',
//                         data: arraypending
//                     }

//                 ]
//             },
//             options: {
//                 plugins: {
//                 legend: {
//                     labels: {
//                     usePointStyle: true,
//                     },
//                  }
//               }
//             }
//         });
//     } 
// }
// hi(jQuery);

