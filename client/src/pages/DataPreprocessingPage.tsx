import { useContext, useEffect, useState } from 'react'; 
import { FileContext, FileContextType } from '../context/fileContextProvider';
import { Link } from 'react-router-dom';
import PreviewTable from '../components/PreviewTable';
import ColumnGroupingsDisplay from '../components/ColumnGroupingsDisplay';
import tableIcon from './../assets/img/table.png';

function DataPreprocessingPage() {
    const { files, headerRowIndex, columnGroupings, updateHeaderRowIndex, updateColumnGroupings } = useContext(FileContext) as unknown as FileContextType; // Accessing FileContext 
    const [fileIndex, setFileIndex] = useState<number>(0); // State to track the index of the selected file
    const [fileContentsArray, setFileContentsArray] = useState<string[][][]>([[[]], [[]], [[]], [[]], [[]]]); // State to store the contents of the selected files
    const [isHeaderRowSelected, setIsHeaderRowSelected] = useState<boolean>(false); // State to track if the header row is selected

    // Function to read file contents
    const readFile = async (index: number) => {
        const selectedFile = files?.[index];
        const reader = new FileReader();
        reader.onload = (event) => {
            setFileContentsArray((fileContentsArray) => {
                const updatedFileContents = fileContentsArray.map((item, i) => {
                    return i === index ? (event.target?.result as string).split('\n').map((row) => row.split(',')) : item;
                });
                return updatedFileContents;
            });
        };
        reader.readAsText(selectedFile as Blob);
    };

    // Function to handle file selection
    const handleFileClick = (index: number) => {
        setFileIndex(() => {return index});
        readFile(index);
        console.log(fileIndex, fileContentsArray);
    }

    // Reading file content on first render
    useEffect(() => {
      readFile(0);
    }, []);

    return (
        <div className='data-preprocess-container'>
            {!isHeaderRowSelected ? (
                <div className='data-preprocess-container-1'>
                    <div className='data-preprocess-list-section'>
                        <div className='data-preprocess-file-list-container'>
                            <h5>Files</h5>
                            <ul className='data-preprocess-file-list'>
                                {files && files.map((file, index) => (
                                    <div
                                        className='data-preprocess-file-list-item'
                                        style={{'backgroundColor': fileIndex === index ? 'rgb(251,230,230)' : 'white'}} 
                                        onClick={() => handleFileClick(index)}
                                    >
                                        <svg fill="none" viewBox="0 0 16 20">
                                            <path 
                                                stroke="currentColor" 
                                                stroke-linecap="round" 
                                                stroke-linejoin="round" 
                                                stroke-width="1.2" 
                                                d="M1 18a.969.969 0 0 0 .933 1h12.134A.97.97 0 0 0 15 18M1 7V5.828a2 2 0 0 1 .586-1.414l2.828-2.828A2 2 0 0 1 5.828 1h8.239A.97.97 0 0 1 15 2v4.639M6 1v4a1 1 0 0 1-1 1H1m2.665 9H2.647A1.647 1.647 0 0 1 1 13.353v-1.706A1.647 1.647 0 0 1 2.647 10h1.018M12 10l1.443 4.773L15 10m-6.057-.152L8 9.828a1.34 1.34 0 0 0-1.359 1.22 1.32 1.32 0 0 0 1.172 1.421l.536.059a1.273 1.273 0 0 1 1.226 1.718c-.2.571-.636.754-1.337.754h-1.13"
                                            />
                                        </svg>  
                                        <li className='data-preprocess-file-list' key={index}>{file.name.split('.')[0]}</li>
                                    </div>
                                ))}
                            </ul>
                        </div>
                        <hr className='horizontal-divider' />
                        <div className='data-preprocessing-header-row-preview'>
                            <h5>Header</h5>
                            <p>Select the row representing the column headers of your dataset.</p>
                            <div>
                                <div className='data-preprocessing-header-row-preview-header'>
                                    <img src={tableIcon} alt=''/>
                                    <p>Row {headerRowIndex[fileIndex]?.headerRowIndex + 1}</p>
                                </div>
                                <div className='data-preprocessing-header-row-preview-body'>
                                    {fileContentsArray[fileIndex][headerRowIndex[fileIndex].headerRowIndex]?.map((header, index) => (
                                        <div id={`header-row-display-item#${index}`} key={index}>
                                            {header.length > 0 && header !== '\r' && header !== '\n' ? (header) : ("(unnamed column)")}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className='nav-data-preprocess'>
                            <Link to='/upload-data'>
                                <button>
                                    <div>
                                        <svg fill="none" viewBox="0 0 14 10">
                                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" d="M13 5H1m0 0 4 4M1 5l4-4"/>
                                        </svg>
                                        Back
                                    </div>
                                </button>
                            </Link>
                            <button onClick={() => {setIsHeaderRowSelected(true); handleFileClick(0)}}>
                                <div>
                                    <svg fill="none" viewBox="0 0 14 10">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                                    </svg>
                                    Next
                                </div>
                            </button>        
                        </div>
                    </div>
                    <div className='data-preprocess-preview-1'>
                        <PreviewTable 
                            fileContent={fileContentsArray[fileIndex]} 
                            fileIndex={fileIndex} 
                            variant='header-row-select'
                            headerRowIndexArray={headerRowIndex}
                            updateHeaderRowIndex={updateHeaderRowIndex}
                        />
                    </div>
                </div>
                ) : (
                    <div className='data-preprocess-container-2'>
                        <div className='data-preprocess-preview-2'>
                            <PreviewTable 
                                fileContent={fileContentsArray[fileIndex]} 
                                fileIndex={fileIndex} 
                                variant='column-grouping'
                                headerRowIndexArray={headerRowIndex}
                                updateHeaderRowIndex={updateHeaderRowIndex}
                            />
                        </div>
                        <div className='data-preprocess-file-list-section-2'> 
                            <div className='data-preprocess-file-list-container-2'>
                                <h5>Files</h5>
                                <ul className='data-preprocess-file-list'>
                                    {files && files.map((file, index) => (
                                        <div 
                                            style={{'backgroundColor': fileIndex === index ? 'rgb(251,230,230)' : 'white'}} 
                                            className='data-preprocess-file-list-item'
                                            onClick={() => handleFileClick(index)}
                                        >
                                            <svg fill="none" viewBox="0 0 16 20">
                                                <path 
                                                    stroke="currentColor" 
                                                    stroke-linecap="round" 
                                                    stroke-linejoin="round" 
                                                    stroke-width="1.2" 
                                                    d="M1 18a.969.969 0 0 0 .933 1h12.134A.97.97 0 0 0 15 18M1 7V5.828a2 2 0 0 1 .586-1.414l2.828-2.828A2 2 0 0 1 5.828 1h8.239A.97.97 0 0 1 15 2v4.639M6 1v4a1 1 0 0 1-1 1H1m2.665 9H2.647A1.647 1.647 0 0 1 1 13.353v-1.706A1.647 1.647 0 0 1 2.647 10h1.018M12 10l1.443 4.773L15 10m-6.057-.152L8 9.828a1.34 1.34 0 0 0-1.359 1.22 1.32 1.32 0 0 0 1.172 1.421l.536.059a1.273 1.273 0 0 1 1.226 1.718c-.2.571-.636.754-1.337.754h-1.13"
                                                />
                                            </svg> 
                                            <li className='data-preprocess-file-list' key={index}>{file.name.split('.')[0]}</li>
                                        </div>
                                    ))}
                                </ul>
                            </div>
                            <hr className='vertical-divider'/>
                            <div className='data-preprocess-column-grouping-section'>
                                <ColumnGroupingsDisplay
                                    fileIndex={fileIndex}
                                    fileContentsArray={fileContentsArray[fileIndex]}
                                    headerRowIndex={headerRowIndex}
                                    columnGroupings={columnGroupings}
                                    updateColumnGroupings={updateColumnGroupings}
                                />
                                <div className='nav-data-preprocess-2' style={{'marginTop': 'auto'}}>
                                    <button onClick={() => setIsHeaderRowSelected(false)}>
                                        <div>
                                            <svg fill="none" viewBox="0 0 14 10">
                                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" d="M13 5H1m0 0 4 4M1 5l4-4"/>
                                            </svg>
                                            Back
                                        </div>
                                    </button>

                                    <Link to='/analysis-selection'>
                                        <button onClick={() => {setIsHeaderRowSelected(false)}}>
                                            <div>
                                                <svg fill="none" viewBox="0 0 14 10">
                                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                                                </svg>
                                                Next
                                            </div>
                                        </button>  
                                    </Link>  
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}

export default DataPreprocessingPage;