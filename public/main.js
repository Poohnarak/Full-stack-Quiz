const form = document.getElementById('vote-form');
var event;

form.addEventListener('submit', e=>{

    const choice = document.querySelector('input[name=language]:checked').value;
    const data = {language: choice};

    fetch('http://localhost:3000/poll',{
        method: 'post',
        body: JSON.stringify(data),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    }).then(res => res.json())
    .catch(err => console.log(err));

    e.preventDefault();
});

fetch("http://localhost:3000/poll")
    .then(res => res.json())
    .then(data => {
        let votes = data.votes;
        let totalVotes = votes.length;
        document.querySelector('#chartTitle').textContent = `Total Votes: ${totalVotes}`;

        let voteCounts = {
            Angular: 0,
            Ember: 0,
            React: 0,
            Vue: 0
        };

        voteCounts = votes.reduce((acc, vote) => (
            (acc[vote.language] = (acc[vote.language] || 0) + parseInt(vote.points)), acc),
            {}
        );

        let dataPoints = [
            { label: 'Angular', y: voteCounts.Angular },
            { label: 'Ember', y: voteCounts.Ember },
            { label: 'React', y: voteCounts.React },
            { label: 'Vue', y: voteCounts.Vue }
        ];

        const chartContainer = document.querySelector('#chartContainer');

        if(chartContainer){

            // Listen for the event.
            document.addEventListener('votesAdded', function (e) {
                document.querySelector('#chartTitle').textContent = `Total Votes: ${e.detail.totalVotes}`;
            });

            const chart = new CanvasJS.Chart('chartContainer', {
                animationEnabled: true,
                theme: 'theme1',
                data:[
                    {
                        type: 'column',
                        dataPoints: dataPoints
                    }
                ]
            });
            chart.render();

             // Enable pusher logging - don't include this in production
             Pusher.logToConsole = true;

             var pusher = new Pusher('9a72b6632b4a2170e628', {
                cluster: 'ap1',
                forceTLS: true
              });

             var channel = pusher.subscribe('language-poll');

             channel.bind('language-vote', function(data) {
               dataPoints.forEach((point)=>{
                   if(point.label==data.language)
                   {
                        point.y+=data.points;
                        totalVotes+=data.points;
                        event = new CustomEvent('votesAdded',{detail:{totalVotes:totalVotes}});
                        // Dispatch the event.
                        document.dispatchEvent(event);
                   }
               });
               chart.render();
             });
        }

});
