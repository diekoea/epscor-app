import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingAnimation from '../components/LoadingAnimation';
import { FileContext, FileContextType } from '../context/fileContextProvider';


function AnalysisProgressPage() {
    const { api } = useContext(FileContext) as unknown as FileContextType; // Accessing FileContext
    const [isAnalysisCompleted, setIsAnalysisCompleted] = useState(false); // State variable to track if analysis is completed
    const navigate = useNavigate();
    useEffect(() => {
        // Setting up interval to periodically check for analysis completion
        const intervalId = setInterval(() => {
            api.get('/get-update', {
                 method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.data.state === "Completed") {
                    setIsAnalysisCompleted(true);
                    clearInterval(intervalId);
                    
                    // Download results
                    api.request({url: '/send-results', responseType: 'blob'})
                    .then(({data}) => {
                        const downloadUrl = window.URL.createObjectURL(new Blob([data]));
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.setAttribute('download', 'results.zip'); //any other extension
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                    })
                }
            });
        }, 60000); // Checking every minute for analysis completion

        return () => clearInterval(intervalId); // Clearing interval on component unmount
    }, [api, isAnalysisCompleted])

     // Function to handle click on start another analysis button
    const handleClick = () => {
       navigate('/upload-data');
       window.location.reload();
    };
    
    return (
        <div>
            {isAnalysisCompleted ? 
                (
                    <div>
                        <h5>Analysis Completed!</h5>
                        <button className='button-nav' onClick={handleClick}>Start Another Analysis</button>
                    </div>
                ) : (
                        <div>
                            <LoadingAnimation />
                            <h5>Analysis in Progress</h5>
                            <span>No need to wait! Results will automatically be downloaded to your device </span>
                        </div>
                    )
            }

        </div>
    )
}

export default AnalysisProgressPage;


