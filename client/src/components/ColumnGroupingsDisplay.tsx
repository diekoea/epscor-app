import { ChangeEvent, useEffect, useState } from "react";
import deleteColumnGroupIcon from './../assets/img/delete-icon.svg';

type ColumnGroupingsDisplayProps = {
    fileContentsArray: string[][]; // The array containing the content of the file, represented as a two-dimensional array of strings
    headerRowIndex: Array<{[key:string]: number}>; // An array containing information about the header row index for each file
    columnGroupings: Array<{[key:string]: string}>; // An array containing the column groupings for each file
    fileIndex: number; // The index of the file in the list of files being processed
    updateColumnGroupings: (columnGroupings: Array<{[key:string]: string}>, updatedColumnGroupingByFile: {[key:string]: string}, fileIndex: number) => void; // A function to update the column groupings
};

function ColumnGroupingsDisplay( props: ColumnGroupingsDisplayProps ) {
    const { fileContentsArray, headerRowIndex, columnGroupings, fileIndex, updateColumnGroupings } = props;
    const fileHeader = fileContentsArray[headerRowIndex[fileIndex].headerRowIndex]; // Extract the file header from the file contents array based on the header row index
    const [isAcceptingInput, setIsAcceptingInput] = useState<boolean>(false); // State variable to control whether the component is accepting input for editing column groupings
    const [columnGroupDisplayTableContents, setDisplayTableContents] = useState<string[][]>  // State variable to hold the contents of the column group display table
    (
        Object.entries(columnGroupings[fileIndex])
              .map(
                  (item) => [item[0], item[1].split(':')[0], item[1].split(':')[1]]
              )
    );

    // State variable to control the visibility of delete row buttons in the display table
    const [showDeleteRowButton, setShowDeleteRowButton] = useState<boolean[]>(Array.from({length: columnGroupDisplayTableContents.length}, () => false));

    // Function to handle input change in the display table
    const handleInputChange = ( e: ChangeEvent<HTMLInputElement>, disPlayTableRowIndex: number, disPlayTableDataIndex: number) => {
        setDisplayTableContents((columnGroupDisplayTableContents) => {
            const updatedColumnGroupDisplayTableContents = columnGroupDisplayTableContents.map((rowItem, rowIndex) => {
                return rowIndex === disPlayTableRowIndex ? (rowItem.map((rowData, rowDataIndex) => {
                    return rowDataIndex === disPlayTableDataIndex ? e.target.value : rowData;
                })):rowItem;

            });
            return updatedColumnGroupDisplayTableContents;
        })
    };

    // Function to handle hover on a row in the display table
    const handleHoverOnRow  = (rowIndex: number) => {
        setShowDeleteRowButton((showDeleteRowButton) => {
            const updatedShowDeleteRowButton = showDeleteRowButton.map((item, i) => {
                return i === rowIndex ? true: item;
            })
            return updatedShowDeleteRowButton;
        })
        console.log(showDeleteRowButton);
    };

    // Function to handle hover off a row in the display table
    const handleHoverLeaveRow  = (rowIndex: number) => {
        setShowDeleteRowButton((showDeleteRowButton) => {
            const updatedShowDeleteRowButton = showDeleteRowButton.map((item, i) => {
                return i === rowIndex ? false: item;
            })
            return updatedShowDeleteRowButton;
        })
        console.log(showDeleteRowButton);
    };

    // Function to add a new row to the display table
    const handleAddRow = () => {
        setDisplayTableContents((columnGroupDisplayTableContents) => {
            return [...columnGroupDisplayTableContents,['','','']]
        })

        setShowDeleteRowButton((showDeleteRowButton) => {
            return [...showDeleteRowButton, false];
        })
    };

    // Function to delete a row from the display table
    const handleDeleteRow = (rowIndex: number) => {
        setDisplayTableContents((columnGroupDisplayTableContents) => {
            const updatedColumnGroupDisplayTableContents = columnGroupDisplayTableContents;
            updatedColumnGroupDisplayTableContents.splice(rowIndex, 1);
            console.log("cg", updatedColumnGroupDisplayTableContents);
            console.log ("rowIndex", rowIndex);
            return updatedColumnGroupDisplayTableContents;
        })

        setShowDeleteRowButton((showDeleteRowButton) => {
            const updatedShowDeleteRowButton = showDeleteRowButton;
            updatedShowDeleteRowButton.splice(rowIndex, 1);
            console.log(updatedShowDeleteRowButton);
            return updatedShowDeleteRowButton;
        })
    };

    // Function to confirm the column groupings after editing
    const handleConfirmGroupings = (fileIndex: number) => {
        const updatedColumnGroupingsByFile: {[key:string] : string} = {};
        columnGroupDisplayTableContents.forEach((item) => {
            let cellRange: string = '';
            if (item[1] && item[2]) {
                cellRange += `${item[1]}:${item[2]}`;
            } else if (item[1]) {
                cellRange += `${item[1]}:${item[1]}`
            }

            if(item[0] && cellRange) {
                updatedColumnGroupingsByFile[item[0]] = cellRange;
            }
        })

        // Update the column groupings using the provided updateColumnGroupings function
        updateColumnGroupings(columnGroupings, updatedColumnGroupingsByFile, fileIndex)

        // Disabling input mode after confirming
        setIsAcceptingInput(false);
    }

    // Effect to detect column groups when the component mounts or the file header changes
    useEffect(() => {
        const detectColumnGroups = (fileHeader: string[]) => {
            const detectGroupName = (header: string) => {
                if (header && header !== '\r' && header !== '\n') {
                    let [start, end] = [header.indexOf('['), header.indexOf(']')];
                    if (start === -1 || end === -1) return header.trim()
                    return header.slice(start+1, end);
                }
                return '';
            }
            
            const updatedFileColumnGroupings = fileHeader?.reduce((accumulator, header, i, self) => {
                const prevGroupName: string = detectGroupName(self[i-1]);
                const currentGroupName: string = detectGroupName(header);
                const nextGroupName: string = detectGroupName(self[i+1]);
    
                if ((!(prevGroupName in accumulator) || prevGroupName !== currentGroupName) && currentGroupName.length > 0) {
                    accumulator[currentGroupName] = `${String.fromCharCode(65 + i)}:`;
                }
    
                if ((!nextGroupName || nextGroupName !== currentGroupName)&& currentGroupName.length > 0){
                    accumulator[currentGroupName] += `${String.fromCharCode(65 + i)}`;
                }
                return accumulator;
            }, {} as {[key: string] : string});
        
            updateColumnGroupings(columnGroupings, updatedFileColumnGroupings, fileIndex);
        }

        // If column groupings are empty for the current file, detect them
        if (Object.entries(columnGroupings[fileIndex]).length === 0) {
            console.log("detecting column groups - file", fileIndex);
            detectColumnGroups(fileHeader);
        }
    }, [columnGroupings, fileHeader, fileIndex, updateColumnGroupings]);

    // Effect to update the display table contents, delete button visibility, and input mode when column groupings change
    useEffect(() => {
        setDisplayTableContents(() => {
            return Object.entries(columnGroupings[fileIndex]).map(
                  (item) => [item[0], item[1].split(':')[0], item[1].split(':')[1]]
              );
        })

        setShowDeleteRowButton(() => {
            return Array.from({length: Object.entries(columnGroupings[fileIndex]).length}, () => false)
        })

        setIsAcceptingInput(() => false);
    }, [columnGroupings, fileIndex])

    return (
        <div className='column-groupings'>
            <h5>Groupings</h5>
            <p>Confirm the column groups in your dataset</p>
            {isAcceptingInput ?
                (
                    <div className='column-groupings-input-container'>
                        <div className='column-groupings-input'>            
                            <div className='column-groupings-input-header'>
                                <div>Group Name</div>
                                <div>Column Range</div>
                            </div>
                            <div className='column-groupings-input-body'>
                                {columnGroupDisplayTableContents.map((item, i) => (
                                    <div className='column-groupings-input-item' onMouseOver={() => handleHoverOnRow(i)} onMouseLeave={() => handleHoverLeaveRow(i)}>
                                        <div>
                                            <input key={i} value={item[0]} onChange={(e) => handleInputChange(e, i, 0)} placeholder='Enter group name'/>
                                        </div>
                                        <div>
                                            <span>Range (</span>
                                            <input key={'start' + i} value={item[1]} onChange={(e) => handleInputChange(e, i, 1)} placeholder='start'/>
                                            <span>&nbsp;</span>
                                            <span>:</span>
                                            <span>&nbsp;</span>
                                            <input key={'end' + i} value={item[2]} onChange={(e) => handleInputChange(e, i, 2)} placeholder='end'/>
                                            <span>)</span>
                                            <div className='delete-list-item-container'>
                                                {showDeleteRowButton[i] &&
                                                    <div className='delete-list-item' key={i} onClick={() => handleDeleteRow(i)}>
                                                        <img src={deleteColumnGroupIcon} alt=''/>
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    ))
                                }
                            </div>
                        </div>

                        <div className='column-groupings-input-add-item' id='add-row-container' onClick={handleAddRow}>
                            <div></div>
                            <svg fill="none" viewBox="0 0 18 18">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 1v16M1 9h16"/>
                            </svg>
                        </div>

                        <button onClick={() => handleConfirmGroupings(fileIndex)}>
                            <div>
                                <svg fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 12 4.7 4.5 9.3-9"/>
                                </svg>
                                Confirm Column Groupings
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className='column-groupings-table-container'>
                        <div className='column-groupings-table'>            
                            <div className='column-groupings-table-header'>
                                <div>Group Name</div>
                                <div>Column Range</div>
                            </div>
                            <div className='column-groupings-table-body'>
                                {columnGroupDisplayTableContents.map((item, i) => (
                                    <div className='column-groupings-table-item'>
                                        <div>{item[0]}</div>
                                        <div>Range ({item[1]} : {item[2]})</div>
                                    </div>    
                                    ))
                                }
                            </div>
                        </div>
     
                        <button onClick={() => setIsAcceptingInput(true)}>
                            <div>
                                <svg fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14.3 4.8 2.9 2.9M7 7H4a1 1 0 0 0-1 1v10c0 .6.4 1 1 1h11c.6 0 1-.4 1-1v-4.5m2.4-10a2 2 0 0 1 0 3l-6.8 6.8L8 14l.7-3.6 6.9-6.8a2 2 0 0 1 2.8 0Z"/>
                                </svg>
                                Edit Column Groupings
                            </div>
                        </button>
                    </div>
                    )      
            }
        </div>
    );
}

export default ColumnGroupingsDisplay;