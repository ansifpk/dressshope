const getPastDays = (date, numberOfDays) =>{
        const pastDays = [];
        for (let i = 0; i < numberOfDays; i++) {
            const pastDay = new Date(date);
            pastDay.setDate(date.getDate() - i);
            pastDays.push(pastDay.toISOString().slice(0, 10));
        }
        return pastDays.reverse(); 
}

module.exports = getPastDays;