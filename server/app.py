import os
import logging
import pandas as pd
import numpy as np
import json
import math
import threading
import seaborn as sns
import matplotlib.pyplot as plt
import shutil
from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS, cross_origin
from concurrent.futures import ThreadPoolExecutor
from multiprocessing import Process

UPLOAD_FOLDER = 'uploads'
RESULT_FOLDER = 'results'
PROCESSES = None

app = Flask(__name__, static_url_path='', static_folder='../client/build')
app.config['SECRET_KEY'] = 'secret!'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['RESULT_FOLDER'] = RESULT_FOLDER
CORS(app, resources={r"/*": {"origins": "*", 'allow_headers': 'Content-Type'}})

# logging
logging.basicConfig(level=logging.DEBUG)
file_handler = logging.FileHandler('app.log')
app.logger.addHandler(file_handler)

# flag for analysis completion
is_completed = False

class PearsonCorrelationAnalyzer: 
    '''
    DESCRIPTION

    Executes Pearson correlation analysis on specimen groups producing a correlation value for each gene
    across multiple specimen groups. The correlation values represent a linear relationship describing the expression 
    levels between each gene. (-1 : perfect negative correlation, 0: no correlation, +1: perfect positive correlation).

    EXPLANATION

    For a dataset with multiple groups,

    ------------------------------------------------
    |          |   Grp 1   |   Grp 2   |   Grp 3   |
    ------------------------------------------------
    | Gene 1   |   150     |   200.5   |   87      |
    ------------------------------------------------
    | Gene 2   |     0     |    0      |    0      |
    ------------------------------------------------
    | Gene 3   |     0     |    8      |    15     |
    ------------------------------------------------
    ...
    ------------------------------------------------
    | Gene n   |           |           |           |
    ------------------------------------------------

    NOTE: Each cell contains dummy experession values for each gene


     -  The analyzer excludes genes with low (i.e. 0) epxression levels across each group.
        In the dataset above, Gene 2 and Gene 3 are ecluded because they are unexpressed in at least one group.
    
     -  Generates a correlation matrix for each group representing the linear relationship between the expression levels
        of genes in the same group.

        For Grp 1,
            ------------------------------------------------------------------------
            |          |   Gene 1  |   Gene 2  |   Gene 3  |    ...    |   Gene n  |
            ------------------------------------------------------------------------
            | Gene 1   |     1     |    0.89   |   -0.53   |    ...    |           |
            ------------------------------------------------------------------------
            | Gene 2   |    0.89   |    1      |    0.16   |    ...    |           |
            ------------------------------------------------------------------------
            | Gene 3   |   -0.53   |    0.16   |     1     |    ...    |           |
            ------------------------------------------------------------------------
            ...
            ------------------------------------------------------------------------
            | Gene n   |           |           |           |           |           |
            ------------------------------------------------------------------------
        
        For Grp 2,
            ------------------------------------------------------------------------
            |          |   Gene 1  |   Gene 2  |   Gene 3  |    ...    |   Gene n  |
            ------------------------------------------------------------------------
            | Gene 1   |     1     |    0.46   |   -0.38   |    ...    |           |
            ------------------------------------------------------------------------
            | Gene 2   |    0.46   |    1      |    0.81   |    ...    |           |
            ------------------------------------------------------------------------
            | Gene 3   |   -0.38   |    0.81   |     1     |    ...    |           |
            ------------------------------------------------------------------------
            ...
            ------------------------------------------------------------------------
            | Gene n   |           |           |           |           |           |
            ------------------------------------------------------------------------
        
        For Grp 3,
            ------------------------------------------------------------------------
            |          |   Gene 1  |   Gene 2  |   Gene 3  |    ...    |   Gene n  |
            ------------------------------------------------------------------------
            | Gene 1   |     1     |   -0.29   |    0.72   |    ...    |           |
            ------------------------------------------------------------------------
            | Gene 2   |   -0.29   |    1      |    0.63   |    ...    |           |
            ------------------------------------------------------------------------
            | Gene 3   |    0.72   |    0.63   |     1     |    ...    |           |
            ------------------------------------------------------------------------
            ...
            ------------------------------------------------------------------------
            | Gene n   |           |           |           |           |           |
            ------------------------------------------------------------------------

        NOTE: Each cell contains dummy correlation values.

     -  Executes a group-wise pearson correlation on the correlation values of each gene.
        
        Group Comparisons: Grp1 vs Grp2,  Grp1 vs Grp3, Grp 2 vs Grp 3

        For Grp1 vs Grp2, 
            NOTE: Pearson correlation is conducted for every gene.

            For Gene 1,

            Grp1                Grp2
            -------------       -------------
            |   Gene 1  |       |   Gene 1  |     
            -------------       -------------
            |     1     |       |     1     |
            -------------       -------------
            |    0.89   |       |    0.46   |
            -------------       -------------
            |   -0.53   |       |   -0.38   |
            -------------       -------------
            ...                 ...
            -------------       -------------
            |           |       |           |
            -------------       -------------

            This results in a correlation value describing the linear relationship between the expression level of Gene1
            across Grp1 and Grp 2.

        
     -  The group-wise comparison of gene correlation values preocudes a result of the format below, describing the extent of change
        in expression levels of genes across the groups.

        RESULT

        ---------------------------------------------------------------------------
        |          |   Grp 1 vs Grp 2   |   Grp 1 vs Grp 3   |   Grp 2 vs Grp 3   |
        ---------------------------------------------------------------------------
        | Gene 1   |        0.167       |        0.358       |        0.472       |
        ---------------------------------------------------------------------------
        | Gene 2   |        0.396       |       -0.253       |        0.724       |
        ---------------------------------------------------------------------------
        | Gene 3   |       -0.608       |        0.923       |        0.431       |
        ---------------------------------------------------------------------------
        ...
        ---------------------------------------------------------------------------
        | Gene n   |                    |                    |                    |
        ---------------------------------------------------------------------------
    '''

    def __init__(self, filename, header_row_index, column_groupings):
        '''
        Purpose:
            - Initializes the PearsonCorrelationAnalyzer object.

        Args:
            - filename: Name of the CSV file containing data.
            - header_row_index: Index of the row to be used as column headers.
            - column_groupings: Dictionary mapping column group names to their corresponding column ranges.

        Attributes:
            - DataFrame: DataFrame containing the data from the CSV file.
            - filename: Name of the CSV file.
            - col_ranges: List of column ranges for each column group.
            - sp_group_names: List of column group names.
            - result: Dictionary to store the result of the analysis.
        '''

        # Load data from CSV file into DataFrame
        self.DataFrame = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], filename), header=header_row_index)
        self.filename = filename

        # Extract column ranges and column group names
        self.col_ranges = [[ord(column_id) - 66 for column_id in range.split(':')] for range in list(column_groupings.values())]
        self.sp_group_names = list(column_groupings.keys())

        # Initialize result dictionary
        self.result = dict()
    
    def preprocess_data(self):
        '''
        Purpose:
            - Sets the index of the DataFrame to the column containing gene names
            - Converts DataFrame columns to numeric type
            - Fills empty data with 0
            - Applies winsorization, gene exclusion, and z-score normalization to the DataFrame
            - Calculates correlation matrices for each group
        '''

        # Set index and convert columns to numeric type
        self.DataFrame.set_index("Unnamed: 0", inplace=True)
        self.DataFrame.index.names = [None]
        self.DataFrame= self.DataFrame.apply(pd.to_numeric, downcast='float')

        # Fill empty data
        self.DataFrame.fillna(0, inplace=True)

        # Helper functions for winsorization, gene exclusion, and z-score normalization
        def winsorize(df):
            def winsorize_row(row):
                q1 = row.quantile(0.25)
                q3 = row.quantile(0.75)
                IQR = q3 - q1
                lower_bound = q1 - 1.5 * IQR
                upper_bound = q3 + 1.5 * IQR
                return row.clip(lower_bound, upper_bound, inplace=False)
            
            return df.apply(winsorize_row, axis=1)
        
        def exclude_unexpressed_genes(df):
            return df.loc[df.mean(axis=1) > 0]
        
        def z_score_normalize(df):
            return df.sub(df.mean(axis=0), axis=1).div(df.std(axis=0), axis=1)
        
        def winsorize_exclude_unxpressed_normalize(df):
            return z_score_normalize(exclude_unexpressed_genes(winsorize(df)))
        
        # Apply preprocessing steps to each group
        Sp_groups = [winsorize_exclude_unxpressed_normalize(self.DataFrame.iloc[:, col_range[0]:col_range[1]+1]).T for col_range in self.col_ranges]

        # Calculate correlation matrices for each group
        self.Groups_Corr = [sp_group.corr(method='pearson') for sp_group in Sp_groups]

        # Cleanup  
        del self.DataFrame
        del Sp_groups

    
    def create_plots(self):
        '''
        Purpose: 
            - Creates plots to visualize the distribution of the result.
                Plots:
                    - Density plots
                    - Box plot
                    - Violin plot
                    - Histograms
        '''
        
        # Create directory to store plots
        dir = os.path.join(app.config['RESULT_FOLDER'], self.filename.split('.')[0], "plots")

        if not os.path.exists(dir):
            os.makedirs(dir)

        categories = list(self.result.keys())
        category_data = [np.array(data.iloc[:,0]) for data in self.result.values()]
        
        sns.set_theme()

        # Distribution Plots
        for i, data in enumerate(category_data):
            plt.figure()
            greater_than_zero = ((data > 0).sum() / data.shape[0]) * 100
            ax = sns.kdeplot(data)
            xs, ys = ax.lines[0].get_data()
            k = np.argmax(ys)
            ax.vlines(xs[k], 0, ys[k], ls='--', color='gray', linewidth=1)
            ax.hlines(ys[k], -1, xs[k], ls='--', color='gray', linewidth=1)
            ax.text(xs[k] + 0.15, ys[k] - 0.1, f'({xs[k]:.2f}, {ys[k]:.2f})', horizontalalignment='center',size='x-small',color='black',weight='semibold')
            ax.set_title(f"{categories[i]} Distribution", weight='semibold', size='large')
            ax.grid(True)
            ax.set_xlim(-1,1)
            ax.set_xlabel("p-value", weight='semibold')
            ax.set_ylabel("Density", weight='semibold')
            path = os.path.join(dir,f"{categories[i]} density-plot.png")
            plt.savefig(path, format="png")
        
        # Histogram
        for i, data in enumerate(category_data):
            plt.figure()
            ax = sns.histplot(data, bins=10, stat='percent')
            ax.set_title(f"{categories[i]} Distribution (Histogram)", weight='semibold', size='large')
            ax.set_xlabel("p-value", weight='semibold')
            ax.set_ylabel("Percentage", weight='semibold')
            path = os.path.join(dir,f"{categories[i]} histogram.png")
            plt.savefig(path, format="png")

        # Box Plot
        plt.figure()
        ax = sns.boxplot(category_data)
        medians = [np.median(data) for data in category_data]
        for i, xtick in enumerate(ax.get_xticks()):
            ax.text(xtick, medians[i] + 0.01, f'{(medians[i]):.2f}', horizontalalignment='center',size='x-small',color='black',weight='semibold')
        ax.set_title("Box Plot", weight='semibold', size='large')
        ax.set_xticklabels(categories, weight='semibold')
        path = os.path.join(dir,f"box-plot.png")
        plt.savefig(path, format="png")

        # Violin Plot
        plt.figure()
        ax = sns.violinplot(category_data, linewidth=1, fill=False)
        medians = [np.median(data) for data in category_data]
        for i, xtick in enumerate(ax.get_xticks()):
            ax.text((xtick - 1) / 2,medians[i] + 0.01, "%.2f" % (medians[i]), horizontalalignment='center',size='x-small', color='red',weight='semibold')
            ax.hlines(medians[i], -1.3, xtick, ls='--', color='black', linewidth=1)
        ax.set_title("Violin Plot", weight='semibold', size='large')
        ax.set_xticklabels(categories, weight='semibold')
        path = os.path.join(dir,f"violin-plot.png")
        plt.savefig(path, format="png")

            
    def compute_correlation_value_by_gene(self, data):
        '''
        Purpose:
            - Computes correlation value for a gene.

        Args:
            - data: Tuple containing gene name, Series containing correlation values of the gene in the groups being compared

        Returns:
            - Tuple containing gene name and correlation value
        '''
        gene, x, y = data
        # app.logger.info("%s - Computing correlation value for %s",  self.filename, gene)
        p_value = x.corr(y, method='pearson')
    
        # app.logger.info("%s - Analysis - %s: %s", self.filename, gene, p_value)

        # Cleanup
        del x
        del y

        return (gene, p_value)

    def start(self):
        '''
        Purpose:
            - Driver of the PearsonCorrelationAnalyzer object.
        '''
        self.preprocess_data() 

        group_count = len(self.Groups_Corr)
        batch_size = 1000

        # Create directory to store results
        dir = os.path.join(app.config['RESULT_FOLDER'], self.filename.split('.')[0], "raw data")

        if not os.path.exists(dir):
            os.makedirs(dir)

        for i in range(group_count):
            for j in range(i+1, group_count):
                comparison = self.sp_group_names[i] + ' vs ' + self.sp_group_names[j]
                app.logger.info("%s - Starting comparison %s", self.filename,  comparison)

                common_genes = list(set(self.Groups_Corr[i]) & set(self.Groups_Corr[j]))
                corr_matrix1, corr_matrix2 = self.Groups_Corr[i].loc[common_genes, common_genes],  self.Groups_Corr[j].loc[common_genes, common_genes]


                # Intialize dictionary to store the result of each comparison
                r_comparison = dict()

                for k in range(0, len(common_genes), batch_size):
                    batch_no = (k // batch_size) + 1
                    app.logger.info("%s - %s - Batch #%d of %d", self.filename,  comparison, batch_no, math.ceil(len(common_genes)/batch_size))

                    with ThreadPoolExecutor(max_workers=10) as executor:
                        try:
                            result = executor.map(self.compute_correlation_value_by_gene, ((gene, corr_matrix1[gene].drop(index=gene), corr_matrix2[gene].drop(index=gene)) for gene in common_genes[k:k+batch_size]))
                            for gene, p_value in result:
                                r_comparison[gene] = [p_value]
                        except Exception as e:
                                app.logger.error("%s: Error during multiprocessing: %s", self.filename, str(e))

                app.logger.info("%s - Completed comparison for %s", self.filename, comparison)

                # Store the result of each comparison in the results folder
                self.result[comparison] = pd.DataFrame(data=r_comparison, index=[comparison]).T.sort_values(by=comparison, ascending=True)
                path = os.path.join(dir, f"{comparison}.csv")
                self.result[comparison].to_csv(path_or_buf=path, index=True)
                app.logger.info("%s: Written to %s file", self.filename, f"{comparison}.csv")

        app.logger.info("Completed analysis for %s", self.filename)


        self.create_plots()    

        # Cleanup
        del self.sp_group_names
        del r_comparison

        return

def analyze(filename, header_row_index, column_groupings):
    analyzer = PearsonCorrelationAnalyzer(filename, header_row_index, column_groupings)
    analyzer.start()

class ProcessManager:
    '''
    DESCRIPTION
        - Starts the execution of Pearson Correlation analysis processes for uploaded files.
    '''

    def __init__(self, files, header_row_index, column_groupings):
        '''
        Initializes the ProcessManager.

        Args:
            - files: List of FileStorage objects representing the uploaded files.
            - header_row_index: List of dictionaries containing the row index of the header row for each uploaded file.
            - column_groupings: List of dictionaries containing the column ranges of each specimen group in the uploaded files.
        '''
        self.files = files
        self.header_row_index = header_row_index
        self.column_groupings = column_groupings
        self.processes = list()

    def start(self):
        '''
        Purpose:
            - Starts the Pearson Correlation analysis processes for each uploaded file.
        '''

        # Start analysis process for each uploaded file
        for i, file in enumerate(self.files):
            p = Process(target=analyze, args=(file.filename, self.header_row_index[i]['headerRowIndex'], self.column_groupings[i]))
            p.start()
            self.processes.append(p)
            app.logger.info(f"Started process: {p.pid} for {file.filename}")

        # Wait for all processes to complete
        for p in self.processes:
            p.join()
        
        # Set flag on analysis completion
        global is_completed
        is_completed = True

        # Clean up
        del self.header_row_index
        del self.column_groupings

@app.route('/')
@cross_origin()
def serve():
    return send_from_directory(app.static_folder,'index.html')

@app.route('/start-analysis', methods=['POST'])
@cross_origin()
def start_analysis():
    '''
    DESCRIPTION 

    Triggers the start of the Pearson correlation analysis for uploaded files in
    the front-end.

    Functions as an entry-point from the front-end

    DATA FROM FRONT-END

    1)  header_row_index
        Reference (Front-end): headerRowIndex 
        Type: Array<{ [key: string]: number }>
        Description: Stores the row index of the header row in the csv file
    
    2)  column_groupings
        Reference (Front-end): columnGroupings
        Type: Array<{ [key: string]: string }>
        Description: Stores the column range of each specimen group in the csv file as a string
    '''

    # Extract data from request
    header_row_index = json.loads(request.form.get('header_row_index'))
    column_groupings = json.loads(request.form.get('column_groupings'))
    files = list(request.files.values())

    # Create directory to store uploaded files
    dir = os.path.join(app.config['UPLOAD_FOLDER'])
    if not os.path.exists(dir):
        os.makedirs(dir)

    # Save uploaded files to the uploads folder
    for file in files:
        path = os.path.join(dir, file.filename)
        file.save(path)

    # Initialize ProcessManager  
    global PROCESSES 
    PROCESSES = ProcessManager(files, header_row_index, column_groupings)

    def run():
        try:
            PROCESSES.start()
        except Exception as e:
            app.logger.error(e)
    
    # Start analysis in a non-blocking manner
    thread = threading.Thread(target=run)
    thread.start()
    
    response = jsonify({'message': 'Analysis Started'})
    response.headers['Content-Type'] = 'application/json'
    return response

@app.route('/get-update', methods=['GET'])
@cross_origin()
def update():
    '''
    Purpose: 
        - Retrieves the current state of the Pearson correlation analysis.

    Returns:
        - {'state': 'Completed'} if the analysis is completed.
        - {'state': 'In Progress'} if the analysis is in progress.
    '''
    global is_completed
    response = jsonify({'state': 'Completed'}) if is_completed else jsonify({'state': 'In Progress'})
    response.headers['Content-Type'] = 'application/json'
    return response

@app.route('/send-results', methods=['GET'])
@cross_origin()
def send_results():
    '''
    Purpose:
        - Sends the results of the Pearson correlation analysis to the client.

    Returns:
        - Zip file containing the analysis results as an attachment.
    '''

    # Create a zip file containing the analysis results
    source_dir = app.config['RESULT_FOLDER']
    shutil.make_archive('results', 'zip', source_dir)

    response = send_file('results.zip', as_attachment=True)

    # Clean up
    shutil.rmtree(os.path.join(app.config['UPLOAD_FOLDER']))
    shutil.rmtree(os.path.join(app.config['RESULT_FOLDER']))
    os.remove('results.zip')

    global PROCESSES
    del PROCESSES

    return response

if __name__ == "__main__":
    app.run(debug=True)