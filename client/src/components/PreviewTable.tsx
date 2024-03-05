import { useState, useEffect } from "react";

type PreviewTableProps = {
    fileContent: string[][]; // The content of the file, represented as a two-dimensional array of strings
    fileIndex: number;  // The index of the file in the list of files being processed
    variant: string; // The variant of the preview table, indicating whether it includes header row selection or not
    headerRowIndexArray: Array<{ [key: string]: number }>; // An array containing information about the header row index for each file
    updateHeaderRowIndex?: (fileIndex: number, rowIndex: number) => void; // An optional function to update the header row index
};

function PreviewTable (props: PreviewTableProps) {
    const { fileContent , fileIndex, variant, headerRowIndexArray, updateHeaderRowIndex } = props;
    const [displayFileContent, setDisplayFileContent] = useState(false); // State to track whether file content is being displayed
    const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null> (null) // State to track the table row currently hovered on
    const fileContentsByRows = fileContent?.slice(0,100); // Slicing the file content to display only the first 100 rows

    // Generating column headers for the table
    const previewTableHeaders = Array.from({length: fileContentsByRows[Math.floor(fileContentsByRows.length / 2)].length}, (_, i) => i).map((_, i) => String.fromCharCode(65 + i));

    // Handler for hovering on a row
    const handleHoverOnRow = (rowIndex: number) => {
        setHoveredRowIndex(() => rowIndex);
    }

    // Handler for hovering off a row
    const handleHoverLeaveRow = () => {
        setHoveredRowIndex(() => null);
    }

    // Handler for clicking on a row
    const handleRowClick = (fileIndex: number, rowIndex: number) => {
        updateHeaderRowIndex && updateHeaderRowIndex(fileIndex, rowIndex);
    }

    // Effect to delay the display of file content by a second
    useEffect(() => {
        setDisplayFileContent(false);
        const timer = setTimeout(() => {
            setDisplayFileContent(true);
        }, 1000);

        return () => clearTimeout(timer);
    }, [fileIndex])



    return(
        <div className='preview-table-container'>
            {!displayFileContent ? (
                <div  className='preview-table-loading-container'>
                    <svg fill="none" viewBox="0 0 24 24">
                        <path 
                            stroke="currentColor" 
                            stroke-linecap="round" 
                            stroke-linejoin="round" 
                            stroke-width="1.2" 
                            d="M17.7 7.7A7.1 7.1 0 0 0 5 10.8M18 4v4h-4m-7.7 8.3A7.1 7.1 0 0 0 19 13.2M6 20v-4h4"
                        />
                    </svg>
                    <p>Loading</p>
                </div>
            ):(
                <div>
                    {!fileContentsByRows?.length ||  !fileContentsByRows?.[0].length ? (
                        <p>The file is empty</p> 
                        ) : (
                            <div style={{'width': '100%'}}>
                                {variant === 'header-row-select' ? (
                                    <table className='preview-table'>
                                        <thead>
                                            <tr>
                                                <td></td>
                                                {previewTableHeaders.map((char, index) => (
                                                    <td key={index}>{char}</td>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fileContentsByRows.map((fileRowData: string[], rowIndex: number) => (
                                                <tr 
                                                    key={rowIndex} 
                                                    onMouseEnter={() => handleHoverOnRow(rowIndex)} 
                                                    onMouseLeave={handleHoverLeaveRow}
                                                    style={{'fontWeight': headerRowIndexArray[fileIndex].headerRowIndex === rowIndex ? "bold": "normal"}}
                                                >
                                                    
                                                    <td className='preview-table-row-number'>
                                                        {headerRowIndexArray[fileIndex].headerRowIndex === rowIndex ? (
                                                            <input 
                                                                type='checkbox' 
                                                                checked 
                                                                onClick={() => handleRowClick(fileIndex, 0)}
                                                            />
                                                        ) : (
                                                            hoveredRowIndex === rowIndex ? (
                                                                <input 
                                                                    type='checkbox' 
                                                                    onClick={() => handleRowClick(fileIndex, rowIndex)} 
                                                                />
                                                                    ) : (
                                                                        rowIndex + 1
                                                        ))}
                                                    </td>
                                                    {fileRowData.map((dataItem, dataIndex) => (
                                                        <td key={dataIndex}>{dataItem}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    ) : (
                                        <table className='preview-table'>
                                            <thead>
                                                <tr>
                                                    <td></td>
                                                    {previewTableHeaders.map((char: string, index: number) => (
                                                        <td key={index}>{char}</td>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {fileContentsByRows.map((fileRowData: string[], rowIndex: number) => (
                                                    <tr 
                                                        key={rowIndex} 
                                                        style={{'fontWeight': headerRowIndexArray[fileIndex].headerRowIndex === rowIndex ? "bold": "normal"}} 
                                                    >
                                                        <td className='preview-table-row-number'>
                                                            {rowIndex + 1}
                                                        </td>
                                                        {fileRowData.map((dataItem, dataIndex) => (
                                                            <td key={dataIndex}>{dataItem}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )
                                } 
                            </div>          
                        )
                    }
                </div>
            )}
        </div>    
    )
}

export default PreviewTable;