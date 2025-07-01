import {expect} from 'chai'
import { PatchDiff, CompareResult } from "../src/code_review_patch";
import { describe } from "mocha"

describe('CompareResult', () => {
    it('should handle new file filename', () => {
        const patchDiff = new PatchDiff()
        patchDiff.diff = '--- /dev/null\n' +
            '+++ b/src/main/java/com/example/demo/Calculator.java\n' +
            '@@ -0,0 +1,1 @@\n' +
            '+// some other change\n';
        const result = new CompareResult('',[patchDiff])
        expect(result.getHunks()[0].fileName).to.equal('src/main/java/com/example/demo/Calculator.java')
    })
    describe('addition only', () => {
        it('should use first changed line as linenumber', () => {
            const patchDiff = new PatchDiff()
            patchDiff.diff = '--- a/src/main/java/com/example/demo/Calculator.java\n' +
                                '+++ b/src/main/java/com/example/demo/Calculator.java\n' +
                                '@@ -1,5 +1,8 @@\n' +
                                '    package com.example.demo;\n' +
                                '\n' +
                                '+\n' +
                                '+// some other change\n' +
                                '+\n' +
                                '    public class Calculator {\n' +
                                '\n' +
                                '        public int add(int a, int b) {'
            const result = new CompareResult('',[patchDiff])
            expect(result.getHunks()[0].lineNumber).to.equal(3)
            expect(result.getHunks()[0].fileName).to.equal('src/main/java/com/example/demo/Calculator.java')
        })

        it('should return 1 as line number when adding on first line', () => {
            const patchDiff = new PatchDiff()
            patchDiff.diff = '--- a/Dockerfile\n' +
                            '+++ b/Dockerfile\n' +
                            '@@ -1,4 +1,5 @@\n' +
                            '-FROM registry.cn-beijing.aliyuncs.com/hub-mirrors/maven:3-jdk-8 AS build\n' +
                            '+change in first line\n' +
                            '+FROM registry.cn-beijing.aliyuncs.com/hub-mirrors/maven:3-jdk-8 AS build\n' +
                            'COPY src /usr/src/app/src\n' +
                            'COPY pom.xml /usr/src/app\n' +
                            'COPY settings.xml /user/src/app/settings.xml`'
            const result = new CompareResult('',[patchDiff])
            expect(result.getHunks()[0].lineNumber).to.equal(1)
        })

        it('should return last line as line number when adding on last line', () => {
            const patchDiff = new PatchDiff()
            patchDiff.diff = '--- a/Dockerfile\n' +
                            '+++ b/Dockerfile\n' +
                            '@@ -10,3 +10,4 @@ ARG JAR_FILE=target/application.jar\n' +
                            ' COPY --from=build /usr/src/app/${JAR_FILE} app.jar\n' +
                            '\n' +
                            ' ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/app.jar"]\n' +
                            '+added line'
            const result = new CompareResult('',[patchDiff])
            expect(result.getHunks()[0].lineNumber).to.equal(13)
        })
    })

    describe('deletion only', () => {
        it('should handle deletion diff', () => {
            const patchDiff = new PatchDiff()
            patchDiff.diff = '--- a/src/test/java/com/example/demo/CalculatorTest.java\n' +
                            '+++ b/src/test/java/com/example/demo/CalculatorTest.java\n' +
                            '@@ -22,10 +22,4 @@ public class CalculatorTest {\n' +
                            '        assertEquals(6, calculator.multiply(2, 3));\n' +
                            '    }\n' +
                            '\n' +
                            '-    @Test\n' +
                            '-    public void testDivide() {\n' +
                            '-        System.out.println(calculator.divide(5, 2));\n' +
                            '-        assertEquals(2.5, calculator.divide(5, 2), 0.001);\n' +
                            '-    }\n' +
                            '-\n' +
                            '}'
            const result = new CompareResult('',[patchDiff])
            expect(result.getHunks()[0].lineNumber).to.equal(24)
        })

        it('should return 1 as linenumber when deleting first line', () => {
            const patchDiff = new PatchDiff()
            patchDiff.diff = '--- a/Dockerfile\n' +
                            '+++ b/Dockerfile\n' +
                            '@@ -1,4 +1,3 @@\n' +
                            '-FROM registry.cn-beijing.aliyuncs.com/hub-mirrors/maven:3-jdk-8 AS build\n' +
                            'COPY src /usr/src/app/src\n' +
                            'COPY pom.xml /usr/src/app\n' +
                            'COPY settings.xml /user/src/app/settings.xml'
            const result = new CompareResult('',[patchDiff])
            expect(result.getHunks()[0].lineNumber).to.equal(1)
        })

        it('should return last line as linenumber when deleting last line', () => {
            const patchDiff = new PatchDiff()
            patchDiff.diff = '--- a/Dockerfile\n' +
                                '+++ b/Dockerfile\n' +
                                '@@ -8,5 +8,3 @@ from registry.cn-beijing.aliyuncs.com/hub-mirrors/openjdk:8-jdk-alpine\n' +
                                ' VOLUME /tmp\n' +
                                ' ARG JAR_FILE=target/application.jar\n' +
                                ' COPY --from=build /usr/src/app/${JAR_FILE} app.jar\n' +
                                '-\n' +
                                '-ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/app.jar"]'
            const result = new CompareResult('',[patchDiff])
            expect(result.getHunks()[0].lineNumber).to.equal(10)
        })
    })

    describe('deletion and addition', () => {
        it('should handle addtion after deletion', () => {
            const patchDiff = new PatchDiff()
            patchDiff.diff = '--- a/Dockerfile\n' +
                            '+++ b/Dockerfile\n' +
                            '@@ -1,11 +1,9 @@\n' +
                            ' FROM registry.cn-beijing.aliyuncs.com/hub-mirrors/maven:3-jdk-8 AS build\n' +
                            '-COPY src /usr/src/app/src\n' +
                            '+some addtion\n' +
                            ' COPY pom.xml /usr/src/app\n' +
                            ' COPY settings.xml /user/src/app/settings.xml\n' +
                            ' RUN mvn -f /usr/src/app/pom.xml -s /user/src/app/settings.xml clean package -DskipTests\n' +
                            '\n' +
                            '-from registry.cn-beijing.aliyuncs.com/hub-mirrors/openjdk:8-jdk-alpine\n' +
                            '-VOLUME /tmp\n' +
                            ' ARG JAR_FILE=target/application.jar\n' +
                            ' COPY --from=build /usr/src/app/${JAR_FILE} app.jar'
            const result = new CompareResult('',[patchDiff])
            expect(result.getHunks()[0].lineNumber).to.equal(2)
        })

        it('should handle deletion after addtion', () => {
            const patchDiff = new PatchDiff()
            patchDiff.diff = '--- a/Dockerfile\n' +
                            '+++ b/Dockerfile\n' +
                            '@@ -1,7 +1,7 @@\n' +
                            ' FROM registry.cn-beijing.aliyuncs.com/hub-mirrors/maven:3-jdk-8 AS build\n' +
                            '+add someting\n' +
                            ' COPY src /usr/src/app/src\n' +
                            ' COPY pom.xml /usr/src/app\n' +
                            '-COPY settings.xml /user/src/app/settings.xml\n' +
                            ' RUN mvn -f /usr/src/app/pom.xml -s /user/src/app/settings.xml clean package -DskipTests\n' +
                            '\n' +
                            ' from registry.cn-beijing.aliyuncs.com/hub-mirrors/openjdk:8-jdk-alpine'
            const result = new CompareResult('',[patchDiff])
            expect(result.getHunks()[0].lineNumber).to.equal(2)
        })
    })

    describe('multi file', () => {
        it('should handle multi diff', () => {
            const patchDiff1 = new PatchDiff()
            patchDiff1.newPath = "src/main/java/com/example/demo/Calculator.java"
            patchDiff1.diff = '--- a/src/main/java/com/example/demo/Calculator.java\n' +
                                '+++ b/src/main/java/com/example/demo/Calculator.java\n' +
                                '@@ -1,5 +1,8 @@\n' +
                                '    package com.example.demo;\n' +
                                '\n' +
                                '+\n' +
                                '+// some other change\n' +
                                '+\n' +
                                '    public class Calculator {\n' +
                                '\n' +
                                '        public int add(int a, int b) {\n' +
                                '@@ -14,4 +17,11 @@ public class Calculator {\n' +
                                '            return a * b;\n' +
                                '        }\n' +
                                '\n' +
                                '+    public double divide(int a, int b) {\n' +
                                '+        if (b == 0) {\n' +
                                '+            throw new IllegalArgumentException("除数不能为零");\n' +
                                '+        }\n' +
                                '+        return (double) a / b;\n' +
                                '+    }\n' +
                                '+\n' +
                                '    }'
            const patchDiff2 = new PatchDiff()
            patchDiff2.newPath = "src/test/java/com/example/demo/CalculatorTest.java"
            patchDiff2.diff = '--- a/src/test/java/com/example/demo/CalculatorTest.java\n' +
                                '+++ b/src/test/java/com/example/demo/CalculatorTest.java\n' +
                                '@@ -22,4 +22,10 @@ public class CalculatorTest {\n' +
                                '            assertEquals(6, calculator.multiply(2, 3));\n' +
                                '        }\n' +
                                '\n' +
                                '+    @Test\n' +
                                '+    public void testDivide() {\n' +
                                '+        System.out.println(calculator.divide(5, 2));\n' +
                                '+        assertEquals(2.5, calculator.divide(5, 2), 0.001);\n' +
                                '+    }\n' +
                                '+\n' +
                                '    }'
            const result = new CompareResult('',[patchDiff1, patchDiff2])
            expect(result.getHunks().length).to.equal(3)
            expect(result.getHunks()[0].lineNumber).to.equal(3)
            expect(result.getHunks()[1].lineNumber).to.equal(20)
            expect(result.getHunks()[2].lineNumber).to.equal(25)
        })
    })
})
