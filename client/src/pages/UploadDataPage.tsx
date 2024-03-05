import React, {ChangeEvent, useState, useRef, DragEvent, FormEvent, MouseEvent, useContext} from 'react';
import { Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FileContext, FileContextType } from '../context/fileContextProvider';
import deleteFileIcon from './../assets/img/delete-icon.svg';

// Accepted format for file input
const acceptedFileFormats = new Set<string> (['csv']);

function UploadDataPage() {
    const fileInputRef = useRef<HTMLInputElement | null>(null); // reference to trigger file input on form
    const [dragIsOver, setDragIsOver] = useState(false); // State to track if file is being dragged over
    const formSubmitRef = useRef<HTMLInputElement | null>(null); // Reference to form submit button
    const [showInvalidFileUploadFormatAlert, setShowInvalidFileUploadFormatAlert] = useState<boolean> (false); // State to show/hide invalid file format alert
    const [showExceededFileUploadLimitAlert, setShowExceededFileUploadLimitAlert] = useState<boolean> (false); // State to show/hide exceeded file upload limit alert
    const { files, addFiles, deleteFile } = useContext(FileContext) as unknown as FileContextType; // Accessing FileContext

    // Handles click for file upload
    const handleClick = () => {
        if (fileInputRef.current){
          fileInputRef.current.click();
        }
    };

    // Handles drag over file upload area
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragIsOver(() => true);
    };

    // Handles drag leaving the file upload area
    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragIsOver(() => false);
    };

    // Handles file drop in the file upload area
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragIsOver(() => false);
        handleFiles(e);
    };

    // Handles file upload
    const handleFiles = (e: ChangeEvent<HTMLInputElement> | DragEvent<HTMLDivElement>) => {
        let uploadedFiles = new Array<File> ();
        if ((e as ChangeEvent<HTMLInputElement>) && (e as ChangeEvent<HTMLInputElement>).target.files) {
            uploadedFiles = Array.from((e as ChangeEvent<HTMLInputElement>).target.files as FileList);
            (e as ChangeEvent<HTMLInputElement>).target.value = '';
        } else if ((e as DragEvent<HTMLDivElement>) && (e as DragEvent<HTMLDivElement>).dataTransfer.files) {
            uploadedFiles = Array.from((e as DragEvent<HTMLDivElement>).dataTransfer.files);
        }

        let uploadedFilesWithAcceptedFormats: Array<File> | null = null;
        uploadedFiles?.forEach((file) => {
            const fileExtension = file.name.split('.').pop();
            // Checks if file format is accepted
            if (acceptedFileFormats.has(fileExtension as string)) {
                uploadedFilesWithAcceptedFormats = uploadedFilesWithAcceptedFormats ? [...uploadedFilesWithAcceptedFormats, file] : [file];
            } else {
                setShowInvalidFileUploadFormatAlert(() => true);
                return;
            }
        });

        // Checks if file upload limit is exceeded
        let filesArrayLength = (files as Array<File>)?.length ?? 0;
        let uploadedFilesWithAcceptedFormatsArrayLength = (uploadedFilesWithAcceptedFormats as unknown as Array<File>)?.length ?? 0;
        if (filesArrayLength + uploadedFilesWithAcceptedFormatsArrayLength > 5) {
            setShowExceededFileUploadLimitAlert(() => true);
        }

        // Updates uploaded file list
        addFiles(uploadedFilesWithAcceptedFormats);
    };

    // Handles deletion of an uploaded file
    const handleFileDelete = (e: MouseEvent<HTMLImageElement>, index: number) => {
        e.preventDefault();

        // Updates uploaded file list
        deleteFile(index);
    }
    
    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
    };

    return (
        <div className='container'>
            <div>
                {showInvalidFileUploadFormatAlert && 
                    <Alert variant="info" onClose={() => setShowInvalidFileUploadFormatAlert(false)} dismissible>
                        <Alert.Heading>Invalid File Upload!</Alert.Heading>
                        <p>
                            We can only accept .csv files right now. 
                            Please upload only CSV files.
                        </p>
                    </Alert>
                }

                {showExceededFileUploadLimitAlert &&
                    <Alert variant="info" onClose={() => setShowExceededFileUploadLimitAlert(false)} dismissible>
                        <Alert.Heading>Oh snap! You have reached the file upload limit!</Alert.Heading>
                        <p>
                            Sorry! You can only upload 5 files at once.
                        </p>
                    </Alert>
                }
            </div>
            <div className='upload-container'>
                <div className='upload-input'>
                    <div 
                        className='upload-input-drag-and-drop'
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{
                            backgroundColor: dragIsOver ? 'rgb(251, 235, 240)' : 'white', 
                            border: dragIsOver ? '2px solid rgba(0,0,0,0.224)' : '2px dashed rgba(0,0,0,0.224)',
                        }}
                    >
                        <div>
                            <svg fill="none" viewBox="0 0 20 19" width={30} height={30} style={{'marginBottom' : '10px'}}>
                                <path 
                                    stroke="currentColor" 
                                    stroke-linecap="round" 
                                    stroke-linejoin="round" 
                                    stroke-width="1" 
                                    d="M15 15h.01M4 12H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-3m-5.5 0V1.07M5.5 5l4-4 4 4"
                                />
                            </svg>
                        </div>
                        <div>
                            <p className='span-text'>
                                <span>Drag and drop or</span>
                                <span>&nbsp;</span>
                                <span className='span-text-action'
                                    style={{'textDecoration' : 'underline', 'color' : '#4372d4'}} 
                                    onClick={handleClick}
                                >
                                    browse your files
                                </span>
                                <span>&nbsp;</span>
                                <span>to upload</span>
                            </p>
                            <p className='span-subtext'>
                                .csv files only
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleFormSubmit}>
                        <input 
                            type='file' 
                            ref={fileInputRef}
                            name='file' 
                            onChange={handleFiles}
                            style={{display: 'none'}}
                        />
                        <input type='Submit' style={{'display': 'none'}} ref={formSubmitRef}/>
                    </form>
                </div>

                {files && 
                    <div className='upload-list-container'>
                        <ul className='upload-list'>
                            {files && files.map((file, index) => (
                                <div className='upload-list-item'>
                                    <svg fill="none" viewBox="0 0 16 20" width={25} height={25} style={{'marginRight' : '10px'}}>
                                        <path 
                                            stroke="currentColor" 
                                            stroke-linecap="round" 
                                            stroke-linejoin="round" 
                                            stroke-width="1.2" 
                                            d="M1 18a.969.969 0 0 0 .933 1h12.134A.97.97 0 0 0 15 18M1 7V5.828a2 2 0 0 1 .586-1.414l2.828-2.828A2 2 0 0 1 5.828 1h8.239A.97.97 0 0 1 15 2v4.639M6 1v4a1 1 0 0 1-1 1H1m2.665 9H2.647A1.647 1.647 0 0 1 1 13.353v-1.706A1.647 1.647 0 0 1 2.647 10h1.018M12 10l1.443 4.773L15 10m-6.057-.152L8 9.828a1.34 1.34 0 0 0-1.359 1.22 1.32 1.32 0 0 0 1.172 1.421l.536.059a1.273 1.273 0 0 1 1.226 1.718c-.2.571-.636.754-1.337.754h-1.13"
                                        />
                                    </svg>    
                                    <li className='upload-list-item' key={index}>{file.name.split('.')[0]}</li>
                                    <div className='delete-list-item'>
                                        <img
                                            src={deleteFileIcon} 
                                            alt='' 
                                            onClick={(e) => handleFileDelete(e, index)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </ul>
                    </div>
                }
            </div>
            {files && 
                <Link to='/data-preprocessing'>
                    <button className='button-nav'>
                        <div>
                            <svg fill="none" viewBox="0 0 14 10">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                            </svg>
                            Next
                        </div>
                    </button>
                </Link>
            }
        </div>
    )
}

export default UploadDataPage;