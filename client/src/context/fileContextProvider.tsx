import { useState, createContext, ReactNode, useEffect } from 'react';
import axios, { AxiosInstance } from 'axios';

export type FileContextType = {
    api: AxiosInstance // Axios instance for API calls
    files: File[] | null; // Array of uploaded files
    headerRowIndex: Array<{ [key: string]: number }>; // Array containing the header row index for each file
    columnGroupings: Array<{ [key:string]: string }>; // Array containing the column groupings for each file
    addFiles: (fileList: File[] | null) => void; // Function to add files to the context
    deleteFile: (id: number) => void; // Function to delete a file from the context
    updateHeaderRowIndex: (fileIndex: number, rowIndex: number) => void; // Function to update the header row index for a file
    updateColumnGroupings: (columnGroupings: Array<{[key:string]: string}>, updatedColumnGroupingByFile: {[key:string]: string}, fileIndex: number) => void; // Function to update the column groupings for a file
}

export const FileContext = createContext<FileContextType | null> (null);

const FileContextProvider = ({ children } : { children: ReactNode}) => {
    const api = axios.create({baseURL: 'https://epscor-app-46698ca12840.herokuapp.com/'});
    const [files, setFiles] = useState<File[] | null>(null);
    const [headerRowIndex, setHeaderRowIndex] = useState<Array<{ [key: string]: number }>>
    (
        Array.from(
            {length: files?.length as number}, 
            (_, i) => i).map(() => ({'headerRowIndex': 0})
        )
    );

    const [columnGroupings, setColumnGrupings] = useState<Array<{ [key:string]: string }>>(() => 
        Array.from(
            {length: files?.length as number}, 
            (_, i) => i).map(() => ({} as {[key: string]: string})
        )
    );

    const addFiles = (fileList: File[] | null) => {
        setFiles((files) => {
            let updatedFiles: Array<File> | null = null;
            updatedFiles = files && fileList ? [...files, ...fileList] : files || fileList;
            updatedFiles = updatedFiles ? updatedFiles.slice(0,5) : updatedFiles;
            console.log("updatedFiles: ",updatedFiles);
            return updatedFiles;
        })
    }

    const deleteFile = (id: number) => {
        setFiles((files) => {
            if (!files) return null;
            const updatedFiles = files?.filter((_, i) => i !== id);
            return updatedFiles.length > 0 ? updatedFiles : null;
        });
    }

    const updateHeaderRowIndex = (fileIndex: number, rowIndex: number) => {
        setHeaderRowIndex((headerRowIndex) => {
            const updatedHeaderRowIndex = headerRowIndex.map((headerRowObj: {[key: string] : number}, i: number) => {
                return i === fileIndex ? {'headerRowIndex' : rowIndex} : headerRowObj;
            });
            return updatedHeaderRowIndex;
        })
    }

    const updateColumnGroupings = (columnGroupings: Array<{[key:string]: string}>, updatedColumnGroupingByFile: {[key:string]: string}, fileIndex: number) => {
        setColumnGrupings((columnGroupings) => {
            const updatedColumnGroupings = columnGroupings.map((columnGroupingByFile, i) => {
                return i === fileIndex ? updatedColumnGroupingByFile : columnGroupingByFile;
            })
            return updatedColumnGroupings;
        })
    }

    // useEffect hook to initialize headerRowIndex and columnGroupings using the length of the files array
    useEffect(() => {
        const updatedHeaderRowIndex = Array.from(
            {length: files?.length as number}, 
            (_, i) => i).map(() => ({'headerRowIndex': 0})
        );
        setHeaderRowIndex(() => updatedHeaderRowIndex);

        const updatedColumnGroupings = Array.from(
            {length: files?.length as number}, 
            (_, i) => i).map(() => ({} as {[key: string]: string})
        );
        setColumnGrupings(() => updatedColumnGroupings);
    }, [files])

    return (
        <FileContext.Provider value = {{ api, files, headerRowIndex, columnGroupings, addFiles, deleteFile, updateHeaderRowIndex, updateColumnGroupings }}>
            {children}
        </FileContext.Provider>
    )
}

export default FileContextProvider;