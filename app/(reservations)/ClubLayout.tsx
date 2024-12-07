import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text } from 'react-native-svg'; // Import Text from react-native-svg
import { FrontendTable } from '../../src/utils/types';

type ClubLayoutProps = {
  tables: FrontendTable[];
  onTableSelect: (tableId: string) => void;
};

const ClubLayout: React.FC<ClubLayoutProps> = ({ tables, onTableSelect }) => {
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  // Define layout for left and right side tables
  const leftSideTables = tables.filter((_, index) => index < 7);
  const rightSideTables = tables.filter((_, index) => index >= 7 && index < 12);

  return (
    <View style={styles.container}>
      {/* Title Included Inside the Layout */}
      <Svg height={windowHeight * 0.65} width={windowWidth * 0.95} viewBox="0 0 800 1000">
        {/* Title */}
        <Text
          x="50%"
          y="30"
          fontSize="24"
          fill="#fff"
          textAnchor="middle"
        >
          Select a Table
        </Text>

        {/* Draw the Stage */}
        <Rect x="200" y="50" width="400" height="80" fill="#444" />
        <Text x="400" y="100" fontSize="24" fill="#fff" textAnchor="middle">
          Stage
        </Text>

        {/* Render Left Side Tables */}
        {leftSideTables.map((table, index) => (
          <React.Fragment key={table.id}>
            <Rect
              x={100}
              y={150 + index * 100} // Staggered y-coordinate for each table
              width={80}
              height={60}
              fill={table.reserved ? "#888" : "#fff"} // Gray for reserved tables, white for available
              opacity={table.reserved ? 0.7 : 1}
              onPress={() => {
                if (!table.reserved) {
                  onTableSelect(table.id);
                }
              }}
            />
            <Text
              x={140} // Position text in the center of the rectangle horizontally
              y={150 + index * 100 + 40} // Position text vertically in the center of the rectangle
              fontSize="16"
              fill={table.reserved ? "#D3D3D3" : "#000"}
              textAnchor="middle"
            >
              {table.number}
            </Text>
            {table.reserved && (
              <>
                {/* Draw an X over reserved tables */}
                <Line
                  x1={100}
                  y1={150 + index * 100}
                  x2={180}
                  y2={210 + index * 100}
                  stroke="#fff"
                  strokeWidth="3"
                />
                <Line
                  x1={180}
                  y1={150 + index * 100}
                  x2={100}
                  y2={210 + index * 100}
                  stroke="#fff"
                  strokeWidth="3"
                />
              </>
            )}
          </React.Fragment>
        ))}

        {/* Render Right Side Tables */}
        {rightSideTables.map((table, index) => (
          <React.Fragment key={table.id}>
            <Rect
              x={620}
              y={150 + index * 100} // Staggered y-coordinate for each table
              width={80}
              height={60}
              fill={table.reserved ? "#888" : "#fff"} // Gray for reserved tables, white for available
              opacity={table.reserved ? 0.7 : 1}
              onPress={() => {
                if (!table.reserved) {
                  onTableSelect(table.id);
                }
              }}
            />
            <Text
              x={660} // Position text in the center of the rectangle horizontally
              y={150 + index * 100 + 40} // Position text vertically in the center of the rectangle
              fontSize="16"
              fill={table.reserved ? "#D3D3D3" : "#000"}
              textAnchor="middle"
            >
              {table.number}
            </Text>
            {table.reserved && (
              <>
                {/* Draw an X over reserved tables */}
                <Line
                  x1={620}
                  y1={150 + index * 100}
                  x2={700}
                  y2={210 + index * 100}
                  stroke="#fff"
                  strokeWidth="3"
                />
                <Line
                  x1={700}
                  y1={150 + index * 100}
                  x2={620}
                  y2={210 + index * 100}
                  stroke="#fff"
                  strokeWidth="3"
                />
              </>
            )}
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#121212',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default ClubLayout;
