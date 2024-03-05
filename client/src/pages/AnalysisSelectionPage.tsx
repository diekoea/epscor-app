import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileContext, FileContextType } from '../context/fileContextProvider';
import Card from '../components/Card';

function AnalysisSelectionPage() {
    const navigate = useNavigate();
    const { api, files, headerRowIndex, columnGroupings } = useContext(FileContext) as unknown as FileContextType; // Accessing FileContext

    // Async function to handle starting analysis
    const handleStartAnalysis = async () => {
        let data = new FormData();
        if (files) {
            for (let i in files) {
                data.append(`file[${i}]`, files[i] as Blob); // Append each file to FormData object
            }
        }
        
         // Append headerRowIndex, columnGroupings, and file_count to FormData object
        data.append('header_row_index', JSON.stringify(headerRowIndex));
        data.append('column_groupings', JSON.stringify(columnGroupings));
        data.append('file_count', JSON.stringify(files?.length));

        api.post('/start-analysis', data, {headers: {'Content-Type': 'multipart/form-data'}})
        .then(response => console.log(response))
        .catch(error => console.log(error.response))

        navigate('/analysis-progress'); // Navigate to analysis progress page
    }

    return (
        <div style={{'width': '50%'}}>
            <div className='analysis-choice-container'>
                <Card name='Inter-Group Gene Expression Correlation Analysis (IGECA)' />
                <Card name='Coming Soon!' />
            </div>
            <div className='nav-analysis-selection'>
                <button className='button-nav' onClick={() => navigate('/data-preprocessing')}>
                    <div>
                        <svg fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" d="M13 5H1m0 0 4 4M1 5l4-4"/>
                        </svg>
                        Back
                    </div>
                </button>
            
                <button className='button-nav' onClick={handleStartAnalysis}>
                    <div>
                        <svg fill="none" viewBox="0 0 16 18">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" d="M1 1.984v14.032a1 1 0 0 0 1.506.845l12.006-7.016a.974.974 0 0 0 0-1.69L2.506 1.139A1 1 0 0 0 1 1.984Z"/>
                        </svg>
                        Start Analysis
                    </div>
                </button>
            </div> 
        </div>
    )
}

export default AnalysisSelectionPage;