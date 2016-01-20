<?php

$run = new CommandPathTagParser();

class CommandPathTagParser
{
  private $input;
  private $sourcePath;
  private $exportType;
  private $parsedCommands = [];
  private $knownCommandGroups = [];

  public function CommandPathTagParser()
  {
    $this->input = filter_input_array(INPUT_GET);

    if (is_array($this->input) && array_key_exists('export', $this->input)) {
      $this->exportType = $this->input['export'];
    }

    if (is_array($this->input) && array_key_exists('source', $this->input)) {
      $this->sourcePath = $this->input['source'];

      $this->runParser();

      switch ($this->exportType) {
        case 'csv':
          $this->downloadCSV();
          break;
        default:
          $this->generatePage();
          break;
      }

      return;
    }

    $this->generatePage();
  }

  public function downloadCSV()
  {
    header('Content-type: text/csv');
    header('Content-Disposition: attachment; filename=botcommands.csv');
    header('Pragma: no-cache');
    header('Expires: 0');

    $outputBuffer = fopen("php://output", 'w');

    if (count($this->parsedCommands) > 0) {
      fputcsv($outputBuffer, array_keys($this->parsedCommands[0]));
    }

    foreach ($this->parsedCommands as $row) {
      fputcsv($outputBuffer, $row);
    }

    fclose($outputBuffer);
  }

  private function generatePage()
  {
    echo '<div style="font-family:Monospace,serif;font-size:16px;">
          <h1>Generate command list from script sources</h1>
          <form action="command-list-generator.php" method="get">
            <input type="text" name="source" value="' . ($this->sourcePath ? $this->sourcePath : '') . '" style="width:500px" placeholder="path/to/source">
            <input type="submit" value="Generate">
          </form>';
    if (count($this->parsedCommands) > 0) {
      echo '<form action="command-list-generator.php" method="get">
            <input type="hidden" name="source" value="' . $this->sourcePath . '">
            <input type="hidden" name="export" value="csv">
            <input type="submit" value="Download CSV">
          </form>';

      echo '<h2>Found ' . count($this->parsedCommands) . ' command paths</h2><table style="border-collapse:collapse;">';

      foreach ($this->parsedCommands as $commandInfo) {
        echo '<tr><td colspan="2">&nbsp;</td></tr>';
        foreach ($commandInfo as $key => $item) {
          echo '<tr style="background-color: #cccccc"><td style="font-weight: bold">' . $key . ':</td><td>' . $item . '</td></tr>';
        }
      }

      echo '</table>';
    }
    echo '</div>';
  }

  private function runParser()
  {
    $scripts = new SortedDirectoryIterator($this->sourcePath, true);
    $taggedLines = [];

    /* @var SplFileInfo $scriptFileInfo */
    foreach ($scripts as $scriptFileInfo) {
      if (
          !$scriptFileInfo->isDir()
          && $scriptFileInfo->getExtension() == 'js'
          && !strpos($scriptFileInfo->getPath(), 'lang')
      ) {
        $scriptFile = @file($scriptFileInfo);

        if ($scriptFile) {
          foreach ($scriptFile as $baseLineNumber => $line) {
            if (strpos($line, '@commandpath')) {
              $taggedLines[] = [$scriptFileInfo, ($baseLineNumber + 1), $line];
            }
            if (strpos($line, 'registerChatCommand')) {
              $this->saveCommandGroup($line);
            }
          }
        }
      }
    }

    foreach ($taggedLines as $taggedLine) {
      $this->parseCommandPathTagLine($taggedLine[0], $taggedLine[1], $taggedLine[2]);
    }
  }

  /**
   * @param SplFileInfo $scriptFileInfo
   * @param int $lineNo
   * @param string $line
   */
  private function parseCommandPathTagLine($scriptFileInfo, $lineNo, $line)
  {

    $line = str_replace('* @commandpath ', '', trim($line));

    // Seperate command and description (These should ALWAYS be seperated by " - ")
    $parts = explode(' - ', trim($line));
    $command = trim(substr($parts[0], 0, (strpos($parts[0], '[') ? strpos($parts[0], '[') - 1 : strlen($parts[0]))));

    $commandInfo = [
        'command' => $command,
        'arguments' => (strpos($parts[0], '[') ? substr($parts[0], strpos($parts[0], '[')) : ''),
        'description' => (array_key_exists(1, $parts) ? $parts[1] : ''),
        'permGroup' => (array_key_exists($permGroup = explode(' ', $command)[0], $this->knownCommandGroups) ? $this->knownCommandGroups[$permGroup] : 'UNKNOWN'),
        'script' => $scriptFileInfo->getBasename(),
        'lineNumber' => $lineNo,
    ];

    $this->parsedCommands[] = $commandInfo;
  }

  private function saveCommandGroup($line)
  {
    $valid = preg_match('/([a-z0-9]+)\',\s?(\d)\);$/', trim($line), $matches);

    if ($valid) {
      $this->knownCommandGroups[$matches[1]] = $matches[2];
    }
  }
}

class SortedDirectoryIterator extends SplHeap
{
  /**
   * @param string $path
   * @param bool $recursive
   */
  public function SortedDirectoryIterator($path, $recursive = true)
  {
    if ($recursive) {
      $iterator = new RecursiveIteratorIterator(
          new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS),
          RecursiveIteratorIterator::SELF_FIRST
      );
    } else {
      $iterator = new IteratorIterator(
          new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS)
      );
    }

    foreach ($iterator as $item) {
      $this->insert($item);
    }
  }

  /**
   * @param SplFileInfo $value1
   * @param SplFileInfo $value2
   * @return int
   */
  protected function compare($value1, $value2)
  {
    return strcasecmp($value2->getRealpath(), $value1->getRealpath());
  }
}